import { Knex } from 'knex'

import { Repository } from '../Repository'

type InboxItemDTO = {
    site_id: number
    actor_id: string
    activity_id: string
}

export class InboxRepository extends Repository {
    constructor(db: Knex) {
        super(db, 'inbox')
    }

    async findByActorId(actorId: string, siteId: number): Promise<InboxItemDTO[]> {
        const results = await this.db(this.tableName)
            .where('actor_id', actorId)
            .where('site_id', siteId)
            .select<InboxItemDTO[]>('*')

        return results
    }

    async create(data: InboxItemDTO): Promise<void> {
        const result = await this.db(this.tableName).insert<number[]>(data)

        if (result.length !== 1) {
            throw new Error('Failed to create inbox item')
        }
    }
}
