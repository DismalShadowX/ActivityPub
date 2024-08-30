import { Knex } from 'knex'

import { Repository } from '../Repository'
import { type ActorDTO } from '../entity/ActorEntity'

export class ActorRepository extends Repository {
    constructor(db: Knex) {
        super(db, 'actors')
    }

    async findById(id: string): Promise<ActorDTO | null> {
        const result = await this.db(this.tableName).where('id', id).first<ActorDTO | undefined>()

        return result ?? null
    }

    async create(data: ActorDTO): Promise<ActorDTO> {
        const result = await this.db(this.tableName).insert<number[]>(data)

        if (result.length !== 1) {
            throw new Error('Failed to create actor')
        }

        const actor = await this.findById(data.id);

        if (!actor) {
            throw new Error('Failed to create actor')
        }

        return actor
    }
}
