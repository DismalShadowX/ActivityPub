import { ActivityEntity, type ActivityDTO } from '../entity/ActivityEntity'
import { ActivityRepository } from '../repository/ActivityRepository'
import { ActorService } from '../service/ActorService'
import { ObjectService } from '../service/ObjectService'

export class ActivityService {
    constructor(
        private readonly activityRepository: ActivityRepository,
        private readonly actorService: ActorService,
        private readonly objectService: ObjectService,
    ) {}

    async findById(id: string): Promise<ActivityEntity | null> {
        const activity = await this.activityRepository.findById(id)

        if (activity) {
            return await this.#buildActivity(activity)
        }

        return null
    }

    async findByIds(ids: string[]): Promise<ActivityEntity[]> {
        const serializedActivities = await this.activityRepository.findByIds(ids)
        const activities: ActivityEntity[] = []

        for (const activity of serializedActivities) {
            const builtActivity = await this.#buildActivity(activity)

            if (builtActivity) {
                activities.push(builtActivity)
            }
        }

        return activities
    }

    async create(data: ActivityDTO): Promise<ActivityEntity> {
        const serializedActivity = await this.activityRepository.create(data)
        const activity = await this.#buildActivity(serializedActivity);

        if (!activity) {
            throw new Error('Failed to create activity')
        }

        return activity;
    }

    async #buildActivity(activity: ActivityDTO) {
        const object = await this.objectService.findById(activity.object_id)
        const actor = await this.actorService.findById(activity.actor_id)

        if (object && actor) {
            return new ActivityEntity(activity.id, activity.type, actor, object)
        }

        return null
    }
}
