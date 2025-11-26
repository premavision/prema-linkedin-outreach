import type { ProfileScrapeResult, Scraper } from './Scraper.js';

const demoProfiles: ProfileScrapeResult[] = [
  {
    headline: 'AI Automation Consultant | Helping teams ship faster',
    about: 'Seasoned consultant focused on reliable automation and AI workflows.',
    currentRole: 'Founder',
    company: 'Prema Vision',
    location: 'Remote',
    industry: 'Information Technology',
  },
  {
    headline: 'Head of Operations at GrowthHub',
    about: 'Ops leader scaling teams and processes for B2B SaaS.',
    currentRole: 'Head of Operations',
    company: 'GrowthHub',
    location: 'Austin, TX',
    industry: 'SaaS',
  },
];

export class DemoScraper implements Scraper {
  async scrapeProfile(url: string): Promise<ProfileScrapeResult> {
    const sample = demoProfiles[Math.floor(Math.random() * demoProfiles.length)];
    return { ...sample, rawHtml: `<demo-snapshot url="${url}"></demo-snapshot>` };
  }
}
