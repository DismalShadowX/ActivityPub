import { type Entity } from '../Entity'

export type ObjectDTO = {
    id: string
    data: JSON
};

export class ObjectEntity implements Entity<ObjectDTO> {
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
