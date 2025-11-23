export interface ProfileScrapeResult {
  headline?: string | null;
  about?: string | null;
  currentRole?: string | null;
  company?: string | null;
  location?: string | null;
  industry?: string | null;
  rawHtml?: string | null;
}

export interface Scraper {
  scrapeProfile(url: string): Promise<ProfileScrapeResult>;
}
