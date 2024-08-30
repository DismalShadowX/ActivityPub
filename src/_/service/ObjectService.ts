import { ObjectEntity, type ObjectDTO } from '../entity/ObjectEntity'
import { ObjectRepository } from '../repository/ObjectRepository'

export class ObjectService {
    constructor(
        private readonly objectRepository: ObjectRepository,
    ) {}

    async findById(id: string): Promise<ObjectEntity | null> {
        const object = await this.objectRepository.findById(id)

        if (!object) {
            return null
        }

        return new ObjectEntity(object.id, object.data)
    }

    async create(data: ObjectDTO): Promise<ObjectEntity> {
        const object = await this.objectRepository.create(data)

        if (!object) {
            throw new Error('Failed to create object')
        }

        return new ObjectEntity(object.id, object.data)
    }
}
