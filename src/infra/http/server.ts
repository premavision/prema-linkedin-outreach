import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { config } from '../../config/env';
import { TargetRepository } from '../persistence/repository/TargetRepository';
import { ProfileRepository } from '../persistence/repository/ProfileRepository';
import { MessageRepository } from '../persistence/repository/MessageRepository';
import { TargetService } from '../../domain/services/TargetService';
import { ScrapeService } from '../../domain/services/ScrapeService';
import { MessageService } from '../../domain/services/MessageService';
import { DemoScraper } from '../automation/DemoScraper';
import { PlaywrightScraper } from '../automation/PlaywrightScraper';
import { LocalLLMClient } from '../llm/LocalLLMClient';
import { OpenAILLMClient } from '../llm/OpenAILLMClient';
import { Scraper } from '../automation/Scraper';

const upload = multer();

const app = express();
app.use(cors());
app.use(express.json());

const targetRepo = new TargetRepository();
const profileRepo = new ProfileRepository();
const messageRepo = new MessageRepository();

let scraper: Scraper;
if (config.scraperMode === 'playwright') {
  scraper = new PlaywrightScraper();
} else {
  scraper = new DemoScraper();
}

const llmClient = config.openAi.apiKey ? new OpenAILLMClient(config.openAi.apiKey, config.openAi.model) : new LocalLLMClient();

const targetService = new TargetService(targetRepo);
const scrapeService = new ScrapeService(scraper, profileRepo, targetRepo);
const messageService = new MessageService(llmClient, messageRepo, targetRepo);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', scraperMode: config.scraperMode });
});

app.post('/targets/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });
  try {
    const result = await targetService.importCsv(req.file.buffer);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get('/targets', async (_req, res) => {
  const targets = await targetService.listTargets();
  res.json(targets);
});

app.get('/targets/:id', async (req, res) => {
  const target = await targetService.getTarget(Number(req.params.id));
  if (!target) return res.status(404).json({ error: 'Target not found' });
  res.json(target);
});

app.post('/targets/:id/scrape', async (req, res) => {
  const id = Number(req.params.id);
  const target = await targetService.getTarget(id);
  if (!target) return res.status(404).json({ error: 'Target not found' });
  try {
    const profile = await scrapeService.scrape(id, target.linkedinUrl);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/targets/:id/generate', async (req, res) => {
  const id = Number(req.params.id);
  const { offerContext, count } = req.body as { offerContext?: string; count?: number };
  if (!offerContext) return res.status(400).json({ error: 'offerContext is required' });
  try {
    const messages = await messageService.generate(id, offerContext, count ?? 2);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/targets/:id/messages', async (req, res) => {
  const id = Number(req.params.id);
  const messages = await messageService.list(id);
  res.json(messages);
});

app.patch('/messages/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { content, status } = req.body as { content?: string; status?: 'DRAFT' | 'APPROVED' | 'DISCARDED' };
  try {
    const updated = await messageService.updateMessage(id, { content, status });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get('/export/approved', async (_req, res) => {
  const messages = await messageService.exportApproved();
  const header = 'name,linkedinUrl,message\n';
  const rows = messages
    .map((m) => `${m.target.name},${m.target.linkedinUrl},"${m.content.replace(/"/g, '""')}"`)
    .join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.send(header + rows);
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export function startServer() {
  app.listen(config.port, () => console.log(`API server running on port ${config.port}`));
  return app;
}

if (require.main === module) {
  startServer();
}
