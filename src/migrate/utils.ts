import { Knex } from 'knex';
import { KvKey } from '@fedify/fedify';

import {
    OBJECT_TYPES,
    ACTIVITY_TYPES
} from './constants.js';

export async function handleKvGet(key: string, db: Knex) {
    // TODO
}

export async function handleKvSet(key: KvKey, value: unknown, db: Knex) {
    if (key[0] === '_fedify') {
        // Exit early, we don't care about this data

        return;
    }

    if (key[0].startsWith('http')) {
        // Determine if this is an object, actor or activity

        if (OBJECT_TYPES.includes(value.type)) {
            // Create / update an object

            return;
        }

        if (ACTIVITY_TYPES.includes(value.type)) {
            // Create an activity (activities can't be updated)

            return;
        }

        if (value.type === 'Person') {
            // Create / update an actor

            return;
        }

        return;
    }

    if (key[key.length - 1] === 'inbox') {
        // Link activity to a user

        return;
    }

    if (key[key.length - 1] === 'outbox') {
        // Link activity to a user

        return;
    }

    if (key[key.length - 1] === 'followers') {
        // Link actor to a user

        return;
    }

    if (key[key.length - 1] === 'following') {
        // Link a user to an actor

        return;
    }

    if (key[key.length - 1] === 'liked') {
        // Link an object to a user

        return;
    }

    if (key[2] === 'keypair') {
        // Update a user's keypair

        return;
    }

    if (key[2] === 'handle') {
        // Update a user's information

        return;
    }
}
