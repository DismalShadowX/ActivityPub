import { type Entity } from '../Entity'
import { ActorEntity } from './ActorEntity'
import { ObjectEntity } from './ObjectEntity'

export enum ActivityType {
    LIKE = 'Like'
}

export type ActivityDTO = {
    id: string
    type: ActivityType
    actor_id: string
    object_id: string
}

export class ActivityEntity implements Entity<ActivityDTO> {
    constructor(
        readonly id: string,
        readonly type: ActivityType,
        readonly actor: ActorEntity,
        readonly object: ObjectEntity,
    ) {}

    serialize() {
        return {
            id: this.id,
            type: this.type,
            actor_id: this.actor.id,
            object_id: this.object.id,
        }
    }
}
