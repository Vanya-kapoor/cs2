import { BaseRepository } from '../../core/base/BaseRepository';
import { BadgeModel } from './badge.model';
import { IBadge, BadgeCategory } from './badge.interface';

export class BadgeRepository extends BaseRepository<IBadge> {
  constructor() {
    super(BadgeModel);
  }

  async findByCategory(category: BadgeCategory): Promise<IBadge[]> {
    return this.find({ category });
  }

  async findByName(name: string): Promise<IBadge | null> {
    return this.findOne({ name });
  }
}
