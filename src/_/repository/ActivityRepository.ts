import { Knex } from 'knex'

import { Repository } from '../Repository'
import { type ActivityDTO } from '../entity/ActivityEntity'

export class ActivityRepository extends Repository {
    constructor(db: Knex) {
        super(db, 'activities')
    }

    async findById(id: string): Promise<ActivityDTO | null> {
        const result = await this.db(this.tableName).where('id', id).first<ActivityDTO | undefined>()

        return result ?? null
    }

    async findByIds(ids: string[]): Promise<ActivityDTO[]> {
        const results = await this.db(this.tableName).whereIn('id', ids)

        return results
    }

    async create(data: ActivityDTO): Promise<ActivityDTO> {
        const result = await this.db(this.tableName).insert<number[]>(data)

        if (result.length !== 1) {
            throw new Error('Failed to create activity')
        }

        const activity = await this.findById(data.id);

        if (!activity) {
            throw new Error('Failed to create activity')
        }

        return activity
    }
}
