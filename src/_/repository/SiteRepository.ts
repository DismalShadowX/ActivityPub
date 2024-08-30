import { Knex } from 'knex'

import { Repository } from '../Repository'
import { type SiteDTO } from '../entity/SiteEntity'

type CreateSiteDTO = Omit<SiteDTO, 'id'>

export class SiteRepository extends Repository {
    constructor(db: Knex) {
        super(db, 'sites')
    }

    async findById(id: number): Promise<SiteDTO | null> {
        const result = await this.db(this.tableName).where('id', id).first<SiteDTO | undefined>()

        return result ?? null
    }

    async findByHostname(hostname: string): Promise<SiteDTO | null> {
        const result = await this.db(this.tableName).where('hostname', hostname).first<SiteDTO | undefined>()

        return result ?? null
    }

    async create(data: CreateSiteDTO): Promise<SiteDTO> {
        const result = await this.db(this.tableName).insert<number[]>(data)

        if (result.length !== 1) {
            throw new Error('Failed to create site')
        }

        const object = await this.findById(result[0]);

        if (!object) {
            throw new Error('Failed to create site')
        }

        return object
    }
}
