import { Knex } from 'knex'

export abstract class Repository {
    constructor(
        protected readonly db: Knex,
        protected readonly tableName: string,
    ) {}
}
