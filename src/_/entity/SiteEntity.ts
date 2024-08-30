import { type Entity } from '../Entity'

export type SiteDTO = {
    id: number
    hostname: string
}

export class SiteEntity implements Entity<SiteDTO> {
    constructor(
        readonly id: number,
        readonly hostname: string,
    ) {}

    serialize() {
        return {
            id: this.id,
            hostname: this.hostname,
        }
    }
}
