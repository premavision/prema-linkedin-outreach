import { Scraper } from '../../infra/automation/Scraper';
import { ProfileRepository } from '../../infra/persistence/repository/ProfileRepository';
import { TargetRepository } from '../../infra/persistence/repository/TargetRepository';

export class ScrapeService {
  constructor(private scraper: Scraper, private profileRepo: ProfileRepository, private targetRepo: TargetRepository) {}

  async scrape(targetId: number, url: string) {
    const profile = await this.scraper.scrapeProfile(url);
    const saved = await this.profileRepo.upsertProfile({ targetId, ...profile });
    await this.targetRepo.updateStatus(targetId, 'PROFILE_SCRAPED');
    return saved;
  }
}
