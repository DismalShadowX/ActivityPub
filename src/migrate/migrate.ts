// Script to facilitate the migration from the key-value store to the database

import Knex from 'knex';
import { Migrator } from './Migrator';

export const db = Knex({
    client: 'mysql2',
    connection: {
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT!),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    },
});

// Initialize the migrator
const migrator = new Migrator(db);

// Reset the database
// - Drops tables associated with the migration, and recreates them
// - Does not drop the key_value table 😅
await migrator.reset();

// Migrate the data
// - Populates the tables with data from the key_value table
await migrator.migrateData();

process.exit(0);
