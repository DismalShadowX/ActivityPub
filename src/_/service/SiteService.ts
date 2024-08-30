import { SiteEntity } from '../entity/SiteEntity'
import { SiteRepository } from '../repository/SiteRepository'

export class SiteService {
    constructor(
        private readonly siteRepository: SiteRepository,
    ) {}

    async findByHostname(host: string): Promise<SiteEntity | null> {
        const site = await this.siteRepository.findByHostname(host)

        if (!site) {
            return null
        }

        return new SiteEntity(site.id, site.hostname)
    }

    async create(hostname: string): Promise<SiteEntity> {
        const site = await this.siteRepository.create({ hostname })

        if (!site) {
            throw new Error('Failed to create site')
        }

        return new SiteEntity(site.id, site.hostname)
    }
}
