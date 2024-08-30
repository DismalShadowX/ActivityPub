import { ActivityEntity } from '../entity/ActivityEntity'
import { ActorEntity } from '../entity/ActorEntity'
import { ActivityService } from './ActivityService'
import { InboxRepository } from '../repository/InboxRepository'
import { SiteEntity } from '../entity/SiteEntity'
export class InboxService {
    constructor(
        private readonly activityService: ActivityService,
        private readonly inboxRepository: InboxRepository,
    ) {}

    async getInboxForActor(actor: ActorEntity, site: SiteEntity): Promise<ActivityEntity[]> {
        const actorActivities = await this.inboxRepository.findByActorId(actor.id, site.id);
        const activities = await this.activityService.findByIds(actorActivities.map(activity => activity.activity_id));

        return activities;
    }

    async addActivityForActor(site: SiteEntity, actor: ActorEntity, activity: ActivityEntity) {
        await this.inboxRepository.create({
            site_id: site.id,
            actor_id: actor.id,
            activity_id: activity.id,
        });
    }
}
