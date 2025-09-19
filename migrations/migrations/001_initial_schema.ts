import type { Knex } from 'knex'

/**
 * Initial database schema for TCG Shopify App
 *
 * Creates MTG cards table
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('mtg_cards', (table) => {
    table.uuid('id').primary()
    table.uuid('oracle_id')
    table.text('name').notNullable()
    table.string('lang', 10)
    table.date('released_at')
    table.text('mana_cost')
    table.decimal('cmc', 10, 2)
    table.text('type_line')
    table.text('oracle_text')
    table.string('power', 20)
    table.string('toughness', 20)
    table.string('loyalty', 20)
    table.text('colors') // JSON
    table.text('color_identity') // JSON
    table.string('set_code', 10)
    table.text('set_name')
    table.string('collector_number', 20)
    table.string('rarity', 20)
    table.text('legalities') // JSON
    table.text('artist')
    table.boolean('reserved').defaultTo(false)
    table.boolean('foil').defaultTo(false)
    table.boolean('digital').defaultTo(false)
    table.text('prices') // JSON
    table.text('image_uris') // JSON
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())

    // Basic indexes
    table.index('name')
    table.index('set_code')
    table.index('rarity')
  })
}

/**
 * Revert the initial database schema
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('mtg_cards')
}
