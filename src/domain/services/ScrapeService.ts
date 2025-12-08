import type { Scraper } from '../../infra/automation/Scraper.js';
import { ProfileRepository } from '../../infra/persistence/repository/ProfileRepository.js';
import { TargetRepository } from '../../infra/persistence/repository/TargetRepository.js';

export class ScrapeService {
  constructor(private scraper: Scraper, private profileRepo: ProfileRepository, private targetRepo: TargetRepository) {}

  async scrape(targetId: number, url: string) {
    if (!url || !url.trim()) {
      throw new Error('LinkedIn URL is missing');
    }
    
    // Basic validation for URL
    try {
        new URL(url);
    } catch {
        throw new Error('Invalid URL format');
    }

    console.log(`[ScrapeService] Starting scrape for target ${targetId}, URL: ${url}`);
    
    try {
        const profile = await this.scraper.scrapeProfile(url);
        const saved = await this.profileRepo.upsertProfile({ targetId, ...profile });
        await this.targetRepo.updateStatus(targetId, 'PROFILE_SCRAPED');
        console.log(`[ScrapeService] Successfully scraped profile for target ${targetId}`);
        return saved;
    } catch (error) {
        console.error(`[ScrapeService] Failed to scrape target ${targetId}:`, error);
        throw error;
    }
  }
}
