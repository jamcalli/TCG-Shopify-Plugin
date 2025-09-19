#!/usr/bin/env tsx

/**
 * MTG Oracle Cards Database Seeder
 *
 * Ultra-fast direct streaming approach - bypasses JSON parsing for maximum speed
 */

import * as Scryfall from 'scryfall-sdk'
import { pipeline } from 'stream/promises'
import { Transform, Readable } from 'stream'
import StreamValues from 'stream-json/streamers/StreamValues.js'
import parser from 'stream-json'
import { Client } from 'pg'
import { from as copyFrom } from 'pg-copy-streams'
import type { ScryfallCard } from '../src/types/scryfall.types.js'
import { config } from 'dotenv'

config()

async function main(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'tcg_shopify'
  })

  await client.connect()
  console.log('Connected to PostgreSQL')

  const tempTable = `mtg_cards_temp_${Date.now()}`
  let processed = 0
  const startTime = Date.now()

  // Ultra-fast transform - minimal processing, no complex escaping
  function createFastCopyTransform(): Transform {
    return new Transform({
      writableObjectMode: true,
      readableObjectMode: false,
      highWaterMark: 100, // Optimize for object mode
      transform(data: { key: string; value: ScryfallCard }, _encoding, callback) {
        try {
          const card = data.value

          // Simple null handling - no complex escaping
          const n = (val: any) => val === null || val === undefined ? '\\N' : String(val).replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ')
          const j = (val: any) => val ? JSON.stringify(val).replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ') : '\\N'

          // Fast row creation - minimal string operations
          const row = `${n(card.id)}\t${n(card.oracle_id)}\t${n(card.name)}\t${n(card.lang)}\t${n(card.released_at)}\t${n(card.mana_cost)}\t${card.cmc || 0}\t${n(card.type_line)}\t${n(card.oracle_text)}\t${n(card.power)}\t${n(card.toughness)}\t${n(card.loyalty)}\t${j(card.colors)}\t${j(card.color_identity || [])}\t${n(card.set)}\t${n(card.set_name)}\t${n(card.collector_number)}\t${n(card.rarity)}\t${j(card.legalities)}\t${n(card.artist)}\t${card.reserved || false}\t${card.finishes?.includes('foil') || false}\t${card.digital || false}\t${j(card.prices)}\t${j(card.image_uris)}\t${new Date().toISOString()}\t${new Date().toISOString()}\n`

          processed++
          this.push(row)
          callback()
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)))
        }
      }
    })
  }

  try {
    console.log('Starting ultra-fast Oracle Cards import...')

    // Create temp table
    await client.query(`CREATE TABLE ${tempTable} (LIKE mtg_cards INCLUDING ALL)`)

    const bulkDataList = await Scryfall.BulkData.definitions()
    const oracleCards = bulkDataList.find(item => item.type === 'oracle_cards')

    if (!oracleCards) {
      throw new Error('Oracle cards bulk data not found')
    }

    console.log(`Dataset: oracle_cards (${(oracleCards.size / 1024 / 1024).toFixed(1)}MB)`)

    // Get stream directly from Scryfall SDK
    const stream = await Scryfall.BulkData.downloadByType('oracle_cards', 0)
    if (!stream) {
      throw new Error('Failed to get stream from Scryfall SDK')
    }

    console.log('🚀 Starting direct stream pipeline...')

    // Create COPY stream to temp table
    const copyStream = client.query(copyFrom(`
      COPY ${tempTable} (
        id, oracle_id, name, lang, released_at, mana_cost, cmc,
        type_line, oracle_text, power, toughness, loyalty, colors,
        color_identity, set_code, set_name, collector_number, rarity,
        legalities, artist, reserved, foil, digital, prices,
        image_uris, created_at, updated_at
      ) FROM STDIN WITH (FORMAT text, DELIMITER E'\\t', NULL '\\N')
    `))

    // DIRECT STREAMING - manually handle Web ReadableStream
    const reader = (stream as ReadableStream<Uint8Array>).getReader()
    let jsonBuffer = ''
    let cardCount = 0

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Convert Uint8Array to string and add to buffer
        const chunk = new TextDecoder().decode(value)
        jsonBuffer += chunk

        // Process complete JSON objects as we find them
        let startIndex = 0
        while (true) {
          // Find the start of a card object
          const objectStart = jsonBuffer.indexOf('{"object":"card"', startIndex)
          if (objectStart === -1) break

          // Find the end of this card object
          let braceCount = 0
          let objectEnd = -1
          let inString = false
          let escapeNext = false

          for (let i = objectStart; i < jsonBuffer.length; i++) {
            const char = jsonBuffer[i]

            if (escapeNext) {
              escapeNext = false
              continue
            }

            if (char === '\\') {
              escapeNext = true
              continue
            }

            if (char === '"') {
              inString = !inString
              continue
            }

            if (!inString) {
              if (char === '{') {
                braceCount++
              } else if (char === '}') {
                braceCount--
                if (braceCount === 0) {
                  objectEnd = i
                  break
                }
              }
            }
          }

          // If we found a complete object, process it
          if (objectEnd !== -1) {
            const cardJson = jsonBuffer.substring(objectStart, objectEnd + 1)

            try {
              const card: ScryfallCard = JSON.parse(cardJson)

              // Create the row for COPY
              const n = (val: any) => val === null || val === undefined ? '\\N' : String(val).replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ')
              const j = (val: any) => val ? JSON.stringify(val).replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ') : '\\N'

              const row = `${n(card.id)}\t${n(card.oracle_id)}\t${n(card.name)}\t${n(card.lang)}\t${n(card.released_at)}\t${n(card.mana_cost)}\t${card.cmc || 0}\t${n(card.type_line)}\t${n(card.oracle_text)}\t${n(card.power)}\t${n(card.toughness)}\t${n(card.loyalty)}\t${j(card.colors)}\t${j(card.color_identity || [])}\t${n(card.set)}\t${n(card.set_name)}\t${n(card.collector_number)}\t${n(card.rarity)}\t${j(card.legalities)}\t${n(card.artist)}\t${card.reserved || false}\t${card.finishes?.includes('foil') || false}\t${card.digital || false}\t${j(card.prices)}\t${j(card.image_uris)}\t${new Date().toISOString()}\t${new Date().toISOString()}\n`

              // Write directly to the COPY stream
              copyStream.write(row)

              cardCount++
              if (cardCount % 1000 === 0) {
                console.log(`Processed ${cardCount.toLocaleString()} cards`)
              }

            } catch (parseError) {
              // Skip invalid JSON
            }

            startIndex = objectEnd + 1
          } else {
            // No complete object found, break and wait for more data
            break
          }
        }

        // Keep unprocessed part of buffer
        if (startIndex > 0) {
          jsonBuffer = jsonBuffer.substring(startIndex)
        }
      }

      // End the COPY stream
      copyStream.end()
      processed = cardCount

    } finally {
      reader.releaseLock()
    }

    const streamDuration = (Date.now() - startTime) / 1000

    // Atomic table swap
    console.log('⚡ Performing atomic table swap...')
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

    console.log('✅ Import completed successfully!')
    console.log(`📊 Total cards: ${processed.toLocaleString()}`)
    console.log(`⏱️  Stream duration: ${streamDuration.toFixed(1)}s`)
    console.log(`🔄 Swap duration: ${swapDuration}ms`)
    console.log(`🎯 Total duration: ${totalDuration.toFixed(1)}s`)
    console.log(`🚀 Rate: ${(processed / totalDuration).toFixed(0)} cards/sec`)

  } catch (error) {
    console.error('❌ Import failed:', error)
    try {
      await client.query(`DROP TABLE IF EXISTS ${tempTable}`)
    } catch {}
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()