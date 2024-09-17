import assert from 'node:assert';
import { KnexKvStore } from './knex.kvstore';
import { Knex } from 'knex';
import { client } from './db';

after(async () => {
    await client.destroy();
});

describe('KnexKvStore', () => {
    it('Implements a basic KvStore', async () => {
        const table = 'key_value';
        const store = await KnexKvStore.create(client, table);

        // Check reading an unset key
        const actualUnsetKey = await store.get(['unsetkey']);
        const expectedUnsetKey = null;
        assert.equal(actualUnsetKey, expectedUnsetKey);

        // Check reading a set key
        await store.set(['setkey'], { hello: 'world' });
        const actualSetKey = await store.get(['setkey']);
        const expectedSetKey = { hello: 'world' };
        assert.deepEqual(actualSetKey, expectedSetKey);

        // Check updating a key
        await store.set(['updated'], { initial: 'value' });
        await store.set(['updated'], { updated: 'value' });
        const actualUpdatedKey = await store.get(['updated']);
        const expectedUpdatedKey = { updated: 'value' };
        assert.deepEqual(actualUpdatedKey, expectedUpdatedKey);

        // Check deleting a key
        await store.set(['deleted'], { initial: 'value' });
        await store.delete(['deleted']);
        const actualDeletedKey = await store.get(['deleted']);
        const expectedDeletedKey = null;
        assert.deepEqual(actualDeletedKey, expectedDeletedKey);
    });

    it('Can store boolean values', async () => {
        const table = 'key_value';
        const store = await KnexKvStore.create(client, table);

        // Check storing true
        await store.set(['boolean_true'], true);
        const actualTrue = await store.get(['boolean_true']);
        const expectedTrue = true;
        assert.equal(actualTrue, expectedTrue);

        // Check storing false
        await store.set(['boolean_false'], false);
        const actualFalse = await store.get(['boolean_false']);
        const expectedFalse = false;
        assert.equal(actualFalse, expectedFalse);
    });
});
