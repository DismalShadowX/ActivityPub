import { Knex } from 'knex'

import { Repository } from '../Repository'
import { type ObjectDTO } from '../entity/ObjectEntity'

export class ObjectRepository extends Repository {
    constructor(db: Knex) {
        super(db, 'objects')
    }

    async findById(id: string): Promise<ObjectDTO | null> {
        const result = await this.db(this.tableName).where('id', id).first<ObjectDTO | undefined>()

        return result ?? null
    }

    async create(data: ObjectDTO): Promise<ObjectDTO> {
        const result = await this.db(this.tableName).insert<number[]>(data)

        if (result.length !== 1) {
            throw new Error('Failed to create object')
        }

        const object = await this.findById(data.id);

        if (!object) {
            throw new Error('Failed to create object')
        }

        return object
    }
}
