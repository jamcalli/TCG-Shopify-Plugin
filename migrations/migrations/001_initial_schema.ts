import type { Knex } from 'knex'

/**
 * Initial database schema for TCG Shopify App
 *
 * Create your initial tables here for your TCG Shopify application.
 * This is a clean template to start with.
 */
export async function up(_knex: Knex): Promise<void> {
  // Example: Create a basic users table
  // await knex.schema.createTable('users', (table) => {
  //   table.increments('id').primary()
  //   table.string('email').notNullable().unique()
  //   table.string('name').notNullable()
  //   table.timestamp('created_at').defaultTo(knex.fn.now())
  //   table.timestamp('updated_at').defaultTo(knex.fn.now())
  //   table.index('email')
  // })
  // Add your tables here for your TCG Shopify app
}

/**
 * Revert the initial database schema
 */
export async function down(_knex: Knex): Promise<void> {
  // Drop tables in reverse order of creation
  // await knex.schema.dropTable('users')
}
