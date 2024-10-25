import Knex from 'knex';
import crypto from 'crypto';

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

// Helper function to get the meta data for an array of activity URIs
// from the database. This allows us to fetch information about the activities
// without having to fetch the full activity object. This is a bit of a hack to
// support sorting / filtering of the activities and should be replaced when we
// have a proper db schema

type ActivityMeta = {
    id: number; // Used for sorting
    actor_id: string; // Used for filtering by follower / non-follower status
    activity_type: string; // Used for filtering by activity type
    object_type: string; // Used for filtering by object type
    reply_object_url: string; // Used for filtering by isReplyToOwn criteria
    reply_object_name: string; // Used for filtering by isReplyToOwn criteria
};

type getActivityMetaQueryResult = {
    key: string,
    left_id: number,
    actor_id: string,
    activity_type: string,
    object_type: string,
    reply_object_url: string,
    reply_object_name: string
}

export async function getSite(host: string) {
    const rows = await client.select('*').from('sites').where({host});

    if (!rows || !rows.length) {
        const webhook_secret = crypto.randomBytes(32).toString('hex');
        await client.insert({host, webhook_secret}).into('sites');

        return {
            host,
            webhook_secret
        };
    }

    if (rows.length > 1) {
        throw new Error(`More than one row found for site ${host}`)
    }

    return {
        host: rows[0].host,
        webhook_secret: rows[0].webhook_secret
    };
}

export async function getActivityMeta(uris: string[]): Promise<Map<string, ActivityMeta>> {
    const results = await client
        .select(
            'left.key',
            'left.id as left_id',
            // mongo schmongo...
            client.raw('JSON_EXTRACT(left.value, "$.actor.id") as actor_id'),
            client.raw('JSON_EXTRACT(left.value, "$.type") as activity_type'),
            client.raw('JSON_EXTRACT(left.value, "$.object.type") as object_type'),
            client.raw('JSON_EXTRACT(right.value, "$.object.url") as reply_object_url'),
            client.raw('JSON_EXTRACT(right.value, "$.object.name") as reply_object_name')
        )
        .from({ left: 'key_value' })
        // @ts-ignore: This works as expected but the type definitions complain 🤔
        .leftJoin(
            { right: 'key_value' },
            client.raw('JSON_UNQUOTE(JSON_EXTRACT(right.value, "$.object.id"))'),
            '=',
            client.raw('JSON_UNQUOTE(JSON_EXTRACT(left.value, "$.object.inReplyTo"))')
        )
        .whereIn('left.key', uris.map(uri => `["${uri}"]`));

    const map = new Map<string, ActivityMeta>();

    for (const result of results as getActivityMetaQueryResult[]) {
        map.set(result.key.substring(2, result.key.length - 2), {
            id: result.left_id,
            actor_id: result.actor_id,
            activity_type: result.activity_type,
            object_type: result.object_type,
            reply_object_url: result.reply_object_url,
            reply_object_name: result.reply_object_name,
        });
    }

    return map;
}

// Helper function to retrieve a map of replies for an array of activity URIs
// from the database
export async function getRepliesMap (uris: string[]): Promise<Map<string, any>> {
    const map = new Map<string, any>();

    const results = await client
        .select('value')
        .from('key_value')
        .where(client.raw('JSON_EXTRACT(value, "$.object.inReplyTo") IS NOT NULL'))
        .whereIn('key', uris.map(uri => `["${uri}"]`));

    for (const {value: result} of results) {
        const replies = map.get(result.object.inReplyTo) ?? [];

        replies.push(result);

        map.set(result.object.inReplyTo, replies);
    }

    return map;
}
