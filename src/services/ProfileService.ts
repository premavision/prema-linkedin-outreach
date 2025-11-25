import type { Scraper } from '../infra/automation/Scraper.js';
import type { ProfileRepository } from '../infra/persistence/repository/ProfileRepository.js';
import type { TargetRepository } from '../infra/persistence/repository/TargetRepository.js';

export class ProfileService {
    constructor(
        private scraper: Scraper,
        private profileRepo: ProfileRepository,
        private targetRepo: TargetRepository
    ) { }

    async scrapeAndStore(targetId: number, url: string) {
        console.log(`Scraping profile for target ${targetId} from ${url}`);
        const profileData = await this.scraper.scrapeProfile(url);

        // Filter out undefined values to satisfy exactOptionalPropertyTypes
        const dataToUpsert: Record<string, any> = { targetId };
        if (profileData.headline !== undefined) dataToUpsert.headline = profileData.headline;
        if (profileData.about !== undefined) dataToUpsert.about = profileData.about;
        if (profileData.currentRole !== undefined) dataToUpsert.currentRole = profileData.currentRole;
        if (profileData.company !== undefined) dataToUpsert.company = profileData.company;
        if (profileData.location !== undefined) dataToUpsert.location = profileData.location;
        if (profileData.industry !== undefined) dataToUpsert.industry = profileData.industry;
        if (profileData.rawHtml !== undefined) dataToUpsert.rawHtml = profileData.rawHtml;

        // Upsert profile
        const savedProfile = await this.profileRepo.upsertProfile(dataToUpsert as any);

        // Update target status
        await this.targetRepo.updateStatus(targetId, 'PROFILE_SCRAPED');

        return savedProfile;
    }

    async getProfile(targetId: number) {
        return this.profileRepo.findByTargetId(targetId);
    }
}
