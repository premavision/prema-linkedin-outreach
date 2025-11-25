import { chromium, type Page } from 'playwright';
import type { Scraper, ProfileScrapeResult } from './Scraper.js';
import * as fs from 'fs';
import * as path from 'path';

export class PlaywrightScraper implements Scraper {
  private mockDir = path.resolve(process.cwd(), 'data/mocks/profiles');

  async scrapeProfile(url: string): Promise<ProfileScrapeResult> {
    // Map URL to a mock file. For demo purposes, we'll just pick a file based on the URL or random.
    // If the URL looks like "profile1", we load profile1.html.
    let filename = 'profile1.html';
    if (url.includes('profile2')) {
      filename = 'profile2.html';
    } else if (url.includes('profile1')) {
      filename = 'profile1.html';
    }

    const filePath = path.join(this.mockDir, filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`Mock file not found: ${filePath}. Falling back to profile1.html`);
      filename = 'profile1.html';
    }

    const fileUrl = `file://${path.join(this.mockDir, filename)}`;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
      await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const headline = await this.safeText(page, 'h1'); // In our mock HTML, h1 is the name, but let's adjust selectors to match mock HTML structure if needed.
      // Wait, in the mock HTML:
      // h1 -> Name
      // .text-body-medium -> Headline
      // .text-body-small.inline -> Location
      // section:has-text("About") div -> About
      // section:has-text("Experience") h3 -> Role
      // section:has-text("Experience") span -> Company

      // Let's adjust selectors to match the mock HTML we just created.
      const name = await this.safeText(page, 'h1');
      const headlineText = await this.safeText(page, '.text-body-medium');
      const location = await this.safeText(page, '.text-body-small.inline');

      // For About, we look for the section with "About" and get the div inside
      const aboutSection = page.locator('section', { hasText: 'About' });
      const about = await aboutSection.locator('div').textContent();

      // For Experience, we take the first li
      const expSection = page.locator('section', { hasText: 'Experience' });
      const firstExp = expSection.locator('ul > li').first();
      const currentRole = await firstExp.locator('h3').textContent();
      const company = await firstExp.locator('span').first().textContent(); // The first span is company

      const industry = await this.safeText(page, 'li.t-14');
      const rawHtml = await page.content();

      return {
        headline: headlineText ?? '',
        about: about?.trim() ?? '',
        currentRole: currentRole?.trim() ?? '',
        company: company?.trim() ?? '',
        location: location ?? '',
        industry: industry ?? '',
        rawHtml
      };
    } catch (e) {
      console.error("Error scraping mock profile:", e);
      throw e;
    } finally {
      await browser.close();
    }
  }

  private async safeText(page: Page, selector: string) {
    const el = await page.$(selector);
    return el ? (await el.textContent())?.trim() ?? null : null;
  }
}
