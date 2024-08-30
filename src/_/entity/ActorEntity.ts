import { type Entity } from '../Entity'

export type ActorDTO = {
    id: string
    data: JSON
}

export class ActorEntity implements Entity<ActorDTO> {
    constructor(
        readonly id: string,
        readonly data: JSON,
    ) {}

    serialize() {
        return {
            id: this.id,
            data: this.data,
        }
    }
}
