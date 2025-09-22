#!/usr/bin/env tsx

/**
 * Scryfall Card Database Importer
 *
 * Efficiently imports the complete Scryfall card database into PostgreSQL
 * using streaming JSON parsing and bulk COPY operations for optimal performance.
 */

import { config } from 'dotenv'
import { Client } from 'pg'
import { from as copyFrom } from 'pg-copy-streams'
import * as Scryfall from 'scryfall-sdk'

config()

async function main(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'tcg_shopify',
  })

  await client.connect()
  console.log('Connected to PostgreSQL')

  const tempTable = `mtg_cards_temp_${Date.now()}`
  let processed = 0
  const startTime = Date.now()

  try {
    console.log('Importing Scryfall card database...')

    await client.query(
      `CREATE TABLE ${tempTable} (LIKE mtg_cards INCLUDING ALL)`,
    )

    const bulkDataList = await Scryfall.BulkData.definitions()
    const allCards = bulkDataList.find((item) => item.type === 'all_cards')

    if (!allCards) {
      throw new Error('Full card database not found')
    }

    console.log(
      `Dataset: all_cards (${(allCards.size / 1024 / 1024).toFixed(1)}MB)`,
    )

    console.log('Initializing streaming import pipeline...')

    // Create PostgreSQL COPY stream for bulk insert
    const copyStream = client.query(
      copyFrom(`
      COPY ${tempTable} (
        id, oracle_id, name, lang, released_at, mana_cost, cmc,
        type_line, oracle_text, power, toughness, loyalty, colors,
        color_identity, set_code, set_name, collector_number, rarity,
        legalities, artist, reserved, foil, digital, prices,
        image_uris, created_at, updated_at
      ) FROM STDIN WITH (FORMAT text, DELIMITER E'\\t', NULL '\\N')
    `),
    )

    // Get the ReadableStream from Scryfall (0 = force download regardless of cache)
    const readableStream = (await Scryfall.BulkData.downloadByType(
      'all_cards',
      0,
    )) as ReadableStream<Uint8Array>
    if (!readableStream) {
      throw new Error('Failed to get stream from Scryfall SDK')
    }

    console.log('Streaming cards to PostgreSQL...')

    // Parse the JSON array from the stream
    const reader = readableStream.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete JSON objects in buffer
        let start = 0
        let depth = 0
        let inString = false
        let escaped = false

        for (let i = 0; i < buffer.length; i++) {
          const char = buffer[i]

          if (escaped) {
            escaped = false
            continue
          }

          if (char === '\\' && inString) {
            escaped = true
            continue
          }

          if (char === '"') {
            inString = !inString
            continue
          }

          if (!inString) {
            if (char === '{') {
              if (depth === 0) start = i
              depth++
            } else if (char === '}') {
              depth--
              if (depth === 0) {
                // Found complete JSON object
                const jsonStr = buffer.slice(start, i + 1)
                try {
                  const card = JSON.parse(jsonStr)

                  if (card?.id) {
                    const escapeValue = (
                      val: string | number | boolean | null | undefined,
                    ): string =>
                      val === null || val === undefined
                        ? '\\N'
                        : String(val)
                            .replace(/\t/g, ' ')
                            .replace(/\n/g, ' ')
                            .replace(/\r/g, ' ')

                    const escapeJson = (
                      val: Record<string, string> | string[] | null | undefined,
                    ): string =>
                      val
                        ? JSON.stringify(val)
                            .replace(/\t/g, ' ')
                            .replace(/\n/g, ' ')
                            .replace(/\r/g, ' ')
                        : '\\N'

                    const row = `${escapeValue(card.id)}\t${escapeValue(card.oracle_id)}\t${escapeValue(card.name)}\t${escapeValue(card.lang)}\t${escapeValue(card.released_at)}\t${escapeValue(card.mana_cost)}\t${card.cmc || 0}\t${escapeValue(card.type_line)}\t${escapeValue(card.oracle_text)}\t${escapeValue(card.power)}\t${escapeValue(card.toughness)}\t${escapeValue(card.loyalty)}\t${escapeJson(card.colors)}\t${escapeJson(card.color_identity || [])}\t${escapeValue(card.set)}\t${escapeValue(card.set_name)}\t${escapeValue(card.collector_number)}\t${escapeValue(card.rarity)}\t${escapeJson(card.legalities)}\t${escapeValue(card.artist)}\t${card.reserved || false}\t${card.finishes?.includes('foil') || false}\t${card.digital || false}\t${escapeJson(card.prices)}\t${escapeJson(card.image_uris)}\t${new Date().toISOString()}\t${new Date().toISOString()}\n`

                    // Write directly to COPY stream
                    if (!copyStream.write(row)) {
                      await new Promise((resolve) =>
                        copyStream.once('drain', resolve),
                      )
                    }

                    processed++
                    if (processed % 10000 === 0) {
                      console.log(
                        `Processed ${processed.toLocaleString()} cards...`,
                      )
                    }
                  }
                } catch (_parseError) {
                  // Skip malformed JSON
                }

                // Remove processed part from buffer
                buffer = buffer.slice(i + 1)
                i = -1 // Reset loop
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
      copyStream.end()

      // Wait for COPY to complete
      await new Promise((resolve, reject) => {
        copyStream.on('finish', resolve)
        copyStream.on('error', reject)
      })
    }

    const importDuration = (Date.now() - startTime) / 1000

    // Perform atomic table swap to ensure zero downtime
    console.log('Performing atomic table swap...')
    const swapStart = Date.now()

    await client.query('BEGIN')
    try {
      await client.query('ALTER TABLE mtg_cards RENAME TO mtg_cards_old')
      await client.query(`ALTER TABLE ${tempTable} RENAME TO mtg_cards`)
      await client.query('DROP TABLE mtg_cards_old')
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }

    const swapDuration = Date.now() - swapStart
    const totalDuration = (Date.now() - startTime) / 1000

    console.log('Import completed successfully')
    console.log(`Cards imported: ${processed.toLocaleString()}`)
    console.log(
      `Import time: ${importDuration.toFixed(1)}s (${(processed / importDuration).toFixed(0)} cards/sec)`,
    )
    console.log(`Swap time: ${swapDuration}ms`)
    console.log(`Total time: ${totalDuration.toFixed(1)}s`)
  } catch (error) {
    console.error('Import failed:', error)
    try {
      await client.query(`DROP TABLE IF EXISTS ${tempTable}`)
      console.log('Cleaned up temporary table')
    } catch (cleanupError) {
      console.error('Failed to cleanup temp table:', cleanupError)
    }
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
