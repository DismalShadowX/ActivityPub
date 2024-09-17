import assert from 'node:assert';
import { MemoryKvStore } from '@fedify/fedify';
import { addToList, removeFromList, scopeKvStore } from './kv-helpers';

describe('Kv Helpers', () => {
    describe('scopeKvStore', () => {
        it('Returns a scoped KvStore', async () => {
            const store = new MemoryKvStore();
            const scopedStore = scopeKvStore(store, ['scoped']);

            await scopedStore.set(['key'], { value: 'da value' });

            {
                const actual = await store.get(['key']);
                const expected = null;
                assert.equal(actual, expected);
            }

            {
                const actual = await scopedStore.get(['key']);
                const expected = { value: 'da value' };
                assert.deepEqual(actual, expected);
            }

            {
                await scopedStore.delete(['key']);
                const actual = await scopedStore.get(['key']);
                const expected = null;
                assert.deepEqual(actual, expected);
            }
        });
    });

    describe('addToList', () => {
        it('Appends items to a key, whether it exists or not', async () => {
            const store = new MemoryKvStore();

            {
                await addToList(store, ['not-existing'], 'first');
                const actual = await store.get(['not-existing']);
                const expected = ['first'];
                assert.deepEqual(actual, expected);
            }

            {
                await store.set(['existing'], ['first']);
                await addToList(store, ['existing'], 'second');
                const actual = await store.get(['existing']);
                const expected = ['first', 'second'];
                assert.deepEqual(actual, expected);
            }
        });
    });

    describe('removeFromList', () => {
        it('Removes an item from a key, whether it exists or not', async () => {
            const store = new MemoryKvStore();

            {
                await removeFromList(store, ['not-existing'], 'first');
                const actual = await store.get(['not-existing']);
                const expected: never[] = [];
                assert.deepEqual(actual, expected);
            }

            {
                await store.set(['existing'], ['first']);
                await removeFromList(store, ['existing'], 'first');
                const actual = await store.get(['existing']);
                const expected: never[] = [];
                assert.deepEqual(actual, expected);
            }
        });
    });
});
