import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
  scraperMode: process.env.SCRAPER_MODE ?? 'demo',
  openAi: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
};
