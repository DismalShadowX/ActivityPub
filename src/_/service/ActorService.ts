import { ActorEntity, type ActorDTO } from '../entity/ActorEntity'
import { ActorRepository } from '../repository/ActorRepository'
export class ActorService {
    constructor(
        private readonly actorRepository: ActorRepository,
    ) {}

    async findById(id: string): Promise<ActorEntity | null> {
        const object = await this.actorRepository.findById(id)

        if (!object) {
            return null
        }

        return new ActorEntity(object.id, object.data)
    }

    async create(data: ActorDTO): Promise<ActorEntity> {
        const object = await this.actorRepository.create(data)

        if (!object) {
            throw new Error('Failed to create object')
        }

        return new ActorEntity(object.id, object.data)
    }
}
