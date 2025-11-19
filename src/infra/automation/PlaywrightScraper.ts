import { chromium, Page } from 'playwright';
import { Scraper, ProfileScrapeResult } from './Scraper';

export class PlaywrightScraper implements Scraper {
  async scrapeProfile(url: string): Promise<ProfileScrapeResult> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const headline = await this.safeText(page, 'h1');
      const about = await this.safeText(page, 'section:has-text("About")');
      const currentRole = await this.safeText(page, 'section:has-text("Experience") h3');
      const company = await this.safeText(page, 'section:has-text("Experience") span');
      const location = await this.safeText(page, 'div.text-body-small.inline');
      const industry = await this.safeText(page, 'li.t-14');
      const rawHtml = await page.content();
      return { headline, about, currentRole, company, location, industry, rawHtml };
    } finally {
      await browser.close();
    }
  }

  private async safeText(page: Page, selector: string) {
    const el = await page.$(selector);
    return el ? (await el.textContent())?.trim() ?? null : null;
  }
}
