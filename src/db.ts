import Knex from 'knex';

export const client = Knex({
    client: 'mysql2',
    connection: {
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT!),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    },
});

await client.schema.createTableIfNotExists('key_value', function (table) {
    table.increments('id').primary();
    table.string('key', 2048);
    table.json('value').notNullable();
    table.datetime('expires').nullable();
});

// Truncate and insert's are just used for dev purposes

const TABLE_SITES = 'sites';
await client.schema.createTableIfNotExists(TABLE_SITES, function (table) {
    table.increments('id').primary();
    table.string('hostname', 2048);
});
await client.table(TABLE_SITES).truncate();

const TABLE_ACTORS = 'actors';
await client.schema.createTableIfNotExists(TABLE_ACTORS, function (table) {
    table.string('id').primary();
    table.json('data').notNullable();
});
await client.table(TABLE_ACTORS).truncate();
await client.table(TABLE_ACTORS).insert({
    id: 'https://localhost/users/1',
    data: {
        id: 'https://localhost/users/1'
    },
});

const TABLE_OBJECTS = 'objects';
await client.schema.createTableIfNotExists(TABLE_OBJECTS, function (table) {
    table.string('id').primary();
    table.json('data').notNullable();
});
await client.table(TABLE_OBJECTS).truncate();

const TABLE_ACTIVITIES = 'activities';
await client.schema.createTableIfNotExists(TABLE_ACTIVITIES, function (table) {
    table.string('id').primary();
    table.enum('type', ['Like']);
    table.string('actor_id');
    table.string('object_id');
});
await client.table(TABLE_ACTIVITIES).truncate();

const TABLE_INBOX = 'inbox';
await client.schema.createTableIfNotExists(TABLE_INBOX, function (table) {
    table.integer('site_id');
    table.string('actor_id');
    table.string('activity_id');
});
await client.table(TABLE_INBOX).truncate();
