import { Knex } from 'knex';

import {
    SITES_TABLE,
    ACTORS_TABLE,
    OBJECTS_TABLE,
    ACTIVITIES_TABLE,
    USERS_TABLE,
    USER_INBOX_TABLE,
    USER_OUTBOX_TABLE,
    USER_FOLLOWERS_TABLE,
    USER_FOLLOWING_TABLE,
    USER_LIKED_TABLE,
    OBJECT_TYPES,
    ACTIVITY_TYPES
} from './constants';

type Row = { key: string, value: any };

export class Migrator {
    private sitesMap = new Map<string, number>();
    private usersMap = new Map<string, number>();
    private actorsMap = new Map<string, number>();
    private objectsMap = new Map<string, number>();
    private activitiesMap = new Map<string, number>();

    constructor(private readonly db: Knex) {}

    async init() {
        await this.initSitesTable();
        await this.initUsersTable();
        await this.initActorsTable();
        await this.initObjectsTable();
        await this.initActivitiesTable();
        await this.initUserInboxTable();
        await this.initUserOutboxTable();
        await this.initUserFollowersTable();
        await this.initUserFollowingTable();
        await this.initUserLikedTable();
    }

    async reset() {
        await this.db.schema.dropTableIfExists(USER_LIKED_TABLE);
        await this.db.schema.dropTableIfExists(USER_FOLLOWING_TABLE);
        await this.db.schema.dropTableIfExists(USER_FOLLOWERS_TABLE);
        await this.db.schema.dropTableIfExists(USER_OUTBOX_TABLE);
        await this.db.schema.dropTableIfExists(USER_INBOX_TABLE);
        await this.db.schema.dropTableIfExists(ACTIVITIES_TABLE);
        await this.db.schema.dropTableIfExists(OBJECTS_TABLE);
        await this.db.schema.dropTableIfExists(ACTORS_TABLE);
        await this.db.schema.dropTableIfExists(USERS_TABLE);
        await this.db.schema.dropTableIfExists(SITES_TABLE);

        await this.init();
    }

    async migrateData() {
        await this.migrateSites();
        await this.migrateUsers();
        await this.migrateActors();
        await this.migrateObjects();
        await this.migrateActivities();
        await this.migrateUserInboxes();
        await this.migrateUserOutboxes();
        await this.migrateUserFollowers();
        await this.migrateUserFollowing();
        await this.migrateUserLiked();
    }

    /**
     * ***************************************
     * Sites
     * ***************************************
     */

    async initSitesTable() {
        await this.db.schema.createTable(SITES_TABLE, (t) => {
            t.increments('id').primary();
            t.string('hostname');
            t.dateTime('created_at');
        });
    }

    async migrateSite(row: Row) {
        const keyJson = JSON.parse(row.key);
        const hostname = keyJson[1];

        if (this.sitesMap.has(hostname)) {
            return;
        }

        const [id] = await this.db.insert({
            hostname,
            created_at: new Date()
        }).into(SITES_TABLE);

        this.sitesMap.set(hostname, id);
    }

    async migrateSites() {
        const rows = await this.db
            .select('key')
            .from('key_value')
            .where('key', 'like', '%sites%')
            .andWhere('key', 'like', '%inbox%');

        for (const row of rows) {
            await this.migrateSite(row);
        }
    }

    /**
     * ***************************************
     * Users
     * ***************************************
     */

    async initUsersTable() {
        await this.db.schema.createTable(USERS_TABLE, (t) => {
            t.increments('id').primary();
            t.integer('site_id').unsigned().references('id').inTable(SITES_TABLE);
            t.string('name')
            t.string('username')
            t.string('bio');
            t.string('avatar');
            t.json('public_key');
            t.json('private_key');
            t.dateTime('created_at')
            t.dateTime('updated_at')
        });
    }

    async migrateUser(row: Row) {
        const keyJson = JSON.parse(row.key);
        const username = keyJson[3];
        const siteId = this.sitesMap.get(keyJson[1]);
        const mapKey = this.makeUserKey(String(siteId), username);

        if (this.usersMap.has(mapKey)) {
            return;
        }

        const keypair = await this.db
            .select('*')
            .from('key_value')
            .where('key', `["sites","${keyJson[1]}","keypair","${username}"]`)
            .first();

        let publicKey = null;
        let privateKey = null;

        if (keypair) {
            publicKey = keypair.value.publicKey;
            privateKey = keypair.value.privateKey;
        }

        const [id] = await this.db.insert({
            site_id: siteId,
            name: row.value.name,
            username: username,
            bio: row.value.summary,
            avatar: row.value.icon,
            public_key: publicKey,
            private_key: privateKey,
            created_at: new Date(),
            updated_at: new Date()
        }).into(USERS_TABLE);

        this.usersMap.set(this.makeUserKey(String(siteId), username), id);
    }

    async migrateUsers() {
        const rows = await this.db
            .select('key', 'value')
            .from('key_value')
            .where('key', 'like', '%handle%');

        for (const row of rows) {
            await this.migrateUser(row);
        }
    }

    /**
     * ***************************************
     * Actors
     * ***************************************
     */

    async initActorsTable() {
        await this.db.schema.createTable(ACTORS_TABLE, (t) => {
            t.increments('id').primary();
            t.string('uri');
            t.json('json_ld');
            t.dateTime('created_at');
        });
    }

    async migrateActor(row: Row) {
        const actor = row.value;

        if (['Person'].includes(actor.type) === false) {
            return;
        }

        const [id] = await this.db.insert({
            uri: actor.id,
            json_ld: actor,
            created_at: new Date(actor.published)
        }).into(ACTORS_TABLE);

        this.actorsMap.set(actor.id, id);
    }

    async migrateActors() {
        const rows = await this.db
            .select('key', 'value')
            .from('key_value')
            .where('key', 'like', '["http%');

        for (const row of rows) {
            await this.migrateActor(row);
        }
    }

    /**
     * ***************************************
     * Objects
     * ***************************************
     */

    async initObjectsTable() {
        await this.db.schema.createTable(OBJECTS_TABLE, (t) => {
            t.increments('id').primary();
            t.string('uri');
            t.enum('type', OBJECT_TYPES);
            t.json('json_ld');
            t.integer('in_reply_to').unsigned().references('id').inTable(OBJECTS_TABLE);
            t.dateTime('created_at');
        });
    }

    async migrateObject(row: Row) {
        const object = row.value;

        if (OBJECT_TYPES.includes(object.type.toLowerCase()) === false) {
            return;
        }

        let inReplyToId = null;

        if (object.inReplyTo !== undefined) {
            inReplyToId = this.objectsMap.get(object.inReplyTo);
        }

        const [id] = await this.db.insert({
            uri: object.id,
            type: object.type.toLowerCase(),
            in_reply_to: inReplyToId,
            json_ld: object,
            created_at: new Date(object.published)
        }).into(OBJECTS_TABLE);

        this.objectsMap.set(object.id, id);
    }

    async migrateObjects() {
        const rows = await this.db
            .select('key', 'value')
            .from('key_value')
            .where('key', 'like', '["http%');

        for (const row of rows) {
            await this.migrateObject(row);
        }
    }

    /**
     * ***************************************
     * Activities
     * ***************************************
     */

    async initActivitiesTable() {
        await this.db.schema.createTable(ACTIVITIES_TABLE, (t) => {
            t.increments('id').primary();
            t.string('uri');
            t.enum('type', ACTIVITY_TYPES);
            t.json('json_ld');
            t.dateTime('created_at');
        });
    }

    async migrateActivity(row: Row) {
        const activity = row.value;

        if (ACTIVITY_TYPES.includes(activity.type.toLowerCase()) === false) {
            return;
        }

        const [id] = await this.db.insert({
            uri: activity.id,
            type: activity.type.toLowerCase(),
            json_ld: activity,
            created_at: new Date(activity.published)
        }).into(ACTIVITIES_TABLE);

        this.activitiesMap.set(activity.id, id);
    }

    async migrateActivities() {
        const rows = await this.db
            .select('key', 'value')
            .from('key_value')
            .where('key', 'like', '["http%');

        for (const row of rows) {
            await this.migrateActivity(row);
        }
    }

    /**
     * ***************************************
     * User inbox
     * ***************************************
     */

    async initUserInboxTable() {
        await this.db.schema.createTable(USER_INBOX_TABLE, (t) => {
            t.increments('id').primary();
            t.integer('user_id').unsigned().references('id').inTable(USERS_TABLE);
            t.integer('activity_id').unsigned().references('id').inTable(ACTIVITIES_TABLE);
            t.dateTime('created_at');
        });
    }

    async migrateUserInbox(userId: number, siteHost: string) {
        const inboxRow = await this.db
            .select('value')
            .from('key_value')
            .where('key', '=', `["sites","${siteHost}","inbox"]`)
            .first();

        if (inboxRow === undefined) {
            return;
        }

        for (const activityUri of inboxRow.value) {
            const activityId = this.activitiesMap.get(activityUri);

            await this.db.insert({
                user_id: userId,
                activity_id: activityId,
                created_at: new Date()
            }).into(USER_INBOX_TABLE);
        }
    }

    async migrateUserInboxes() {
        for (const [key, value] of this.usersMap.entries()) {
            const [siteId] = key.split(':');
            const userId = value;

            let siteHost = null;

            this.sitesMap.forEach((id, host) => {
                if (id === Number(siteId)) {
                    siteHost = host;
                }
            });

            if (siteHost === null) {
                continue;
            }

            await this.migrateUserInbox(userId, siteHost);
        }
    }

    /**
     * ***************************************
     * User outbox
     * ***************************************
     */

    async initUserOutboxTable() {
        await this.db.schema.createTable(USER_OUTBOX_TABLE, (t) => {
            t.increments('id').primary();
            t.integer('user_id').unsigned().references('id').inTable(USERS_TABLE);
            t.integer('activity_id').unsigned().references('id').inTable(ACTIVITIES_TABLE);
            t.dateTime('created_at');
        });
    }

    async migrateUserOutbox(userId: number, siteHost: string) {
        const outboxRow = await this.db
            .select('value')
            .from('key_value')
            .where('key', '=', `["sites","${siteHost}","outbox"]`)
            .first();

        if (outboxRow === undefined) {
            return;
        }

        for (const activityUri of outboxRow.value) {
            const activityId = this.activitiesMap.get(activityUri);

            await this.db.insert({
                user_id: userId,
                activity_id: activityId,
                created_at: new Date()
            }).into(USER_OUTBOX_TABLE);
        }
    }

    async migrateUserOutboxes() {
        for (const [key, value] of this.usersMap.entries()) {
            const [siteId] = key.split(':');
            const userId = value;

            let siteHost = null;

            this.sitesMap.forEach((id, host) => {
                if (id === Number(siteId)) {
                    siteHost = host;
                }
            });

            if (siteHost === null) {
                continue;
            }

            await this.migrateUserOutbox(userId, siteHost);
        }
    }

    /**
     * ***************************************
     * User followers
     * ***************************************
     */

    async initUserFollowersTable() {
        await this.db.schema.createTable(USER_FOLLOWERS_TABLE, (t) => {
            t.increments('id').primary();
            t.integer('user_id').unsigned().references('id').inTable(USERS_TABLE);
            t.integer('actor_id').unsigned().references('id').inTable(ACTORS_TABLE);
            t.dateTime('created_at');
        });
    }

    async migrateUserFollower(userId: number, actorUri: string) {
        const actorId = this.actorsMap.get(actorUri);

        await this.db.insert({
            user_id: userId,
            actor_id: actorId,
            created_at: new Date()
        }).into(USER_FOLLOWERS_TABLE);
    }

    async migrateUserFollowers() {
        for (const [key, value] of this.usersMap.entries()) {
            const [siteId] = key.split(':');
            const userId = value;

            let siteHost = null;

            this.sitesMap.forEach((id, host) => {
                if (id === Number(siteId)) {
                    siteHost = host;
                }
            });

            if (siteHost === null) {
                continue;
            }

            const followersRow = await this.db
                .select('value')
                .from('key_value')
                .where('key', '=', `["sites","${siteHost}","followers"]`)
                .first();

            if (followersRow === undefined) {
                continue;
            }

            for (const actorUri of followersRow.value) {
                await this.migrateUserFollower(userId, actorUri);
            }
        }
    }

    /**
     * ***************************************
     * User following
     * ***************************************
     */

    async initUserFollowingTable() {
        await this.db.schema.createTable(USER_FOLLOWING_TABLE, (t) => {
            t.increments('id').primary();
            t.integer('user_id').unsigned().references('id').inTable(USERS_TABLE);
            t.integer('actor_id').unsigned().references('id').inTable(ACTORS_TABLE);
            t.dateTime('created_at');
        });
    }

    async migrateUserFollow(userId: number, actorUri: string) {
        const actorId = this.actorsMap.get(actorUri);

        await this.db.insert({
            user_id: userId,
            actor_id: actorId,
            created_at: new Date()
        }).into(USER_FOLLOWING_TABLE);
    }

    async migrateUserFollowing() {
        for (const [key, value] of this.usersMap.entries()) {
            const [siteId] = key.split(':');
            const userId = value;

            let siteHost = null;

            this.sitesMap.forEach((id, host) => {
                if (id === Number(siteId)) {
                    siteHost = host;
                }
            });

            if (siteHost === null) {
                continue;
            }

            const followingRow = await this.db
                .select('value')
                .from('key_value')
                .where('key', '=', `["sites","${siteHost}","following"]`)
                .first();

            if (followingRow === undefined) {
                continue;
            }

            for (const actorUri of followingRow.value) {
                await this.migrateUserFollow(userId, actorUri);
            }
        }
    }

    /**
     * ***************************************
     * User liked
     * ***************************************
     */

    async initUserLikedTable() {
        await this.db.schema.createTable(USER_LIKED_TABLE, (t) => {
            t.increments('id').primary();
            t.integer('user_id').unsigned().references('id').inTable(USERS_TABLE);
            t.integer('object_id').unsigned().references('id').inTable(OBJECTS_TABLE);
            t.dateTime('created_at');
        });
    }

    async migrateUserLike(userId: number, siteHost: string) {
        const likedRow = await this.db
            .select('value')
            .from('key_value')
            .where('key', '=', `["sites","${siteHost}","liked"]`)
            .first();

        if (likedRow === undefined) {
            return;
        }

        for (const objectUri of likedRow.value) {
            const objectId = this.objectsMap.get(objectUri);

            await this.db.insert({
                user_id: userId,
                object_id: objectId,
                created_at: new Date()
            }).into(USER_LIKED_TABLE);
        }
    }

    async migrateUserLiked() {
        for (const [key, value] of this.usersMap.entries()) {
            const [siteId] = key.split(':');
            const userId = value;

            let siteHost = null;

            this.sitesMap.forEach((id, host) => {
                if (id === Number(siteId)) {
                    siteHost = host;
                }
            });

            if (siteHost === null) {
                continue;
            }

            await this.migrateUserLike(userId, siteHost);
        }
    }

    private makeUserKey(siteId: string, username: string) {
        return `${siteId}:${username}`;
    }
}
