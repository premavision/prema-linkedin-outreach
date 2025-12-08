import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { config } from '../../config/env.js';
import { TargetRepository } from '../persistence/repository/TargetRepository.js';
import { ProfileRepository } from '../persistence/repository/ProfileRepository.js';
import { MessageRepository } from '../persistence/repository/MessageRepository.js';
import { ConfigRepository } from '../persistence/repository/ConfigRepository.js';
import { TargetService } from '../../domain/services/TargetService.js';
import { ScrapeService } from '../../domain/services/ScrapeService.js';
import { MessageService } from '../../domain/services/MessageService.js';
import { DemoScraper } from '../automation/DemoScraper.js';
import { PlaywrightScraper } from '../automation/PlaywrightScraper.js';
import { LocalLLMClient } from '../llm/LocalLLMClient.js';
import { OpenAILLMClient } from '../llm/OpenAILLMClient.js';
import { Scraper } from '../automation/Scraper.js';
import { prisma } from '../persistence/prismaClient.js';

const upload = multer();

const app = express();
app.use(cors());
app.use(express.json());

const targetRepo = new TargetRepository();
const profileRepo = new ProfileRepository();
const messageRepo = new MessageRepository();
const configRepo = new ConfigRepository();

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
  console.log(`[POST /targets/${id}/generate] Request body:`, req.body);
  if (!offerContext) return res.status(400).json({ error: 'offerContext is required' });
  try {
    const messages = await messageService.generate(id, offerContext, count ?? 2);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/targets/:id/discard-all', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await messageService.discardAll(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/targets/:id/regenerate', async (req, res) => {
  const id = Number(req.params.id);
  const { offerContext, count } = req.body as { offerContext?: string; count?: number };
  if (!offerContext) return res.status(400).json({ error: 'offerContext is required' });
  try {
    const messages = await messageService.regenerate(id, offerContext, count ?? 2);
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
    const updateData: { content?: string; status?: 'DRAFT' | 'APPROVED' | 'DISCARDED' } = {};
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    const updated = await messageService.updateMessage(id, updateData);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.delete('/messages/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await messageService.deleteMessage(id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get('/export/approved', async (_req, res) => {
  const messages = await messageService.exportNewApproved();
  const header = 'name,role,company,linkedinUrl,approvedMessage\n';
  const rows = messages
    .map((m) => {
      const name = m.target.name;
      const role = m.target.role ?? '';
      const company = m.target.company ?? '';
      const linkedinUrl = m.target.linkedinUrl;
      const message = m.content.replace(/"/g, '""');
      return `"${name}","${role}","${company}","${linkedinUrl}","${message}"`;
    })
    .join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.send(header + rows);
});

app.get('/export/stats', async (_req, res) => {
  try {
    const count = await messageService.getNewApprovedCount();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/config/:key', async (req, res) => {
  try {
    const value = await configRepo.get(req.params.key);
    res.json({ value });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/config/:key', async (req, res) => {
  try {
    await configRepo.set(req.params.key, req.body.value);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/reset', async (_req, res) => {
  try {
    // Delete in reverse order of dependencies
    await prisma.message.deleteMany();
    await prisma.profileSnapshot.deleteMany();
    await prisma.target.deleteMany();
    res.json({ message: 'Database reset successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export async function startServer() {
  console.log('Starting server...');
  // Intentionally not logging the full database URL to avoid leaking credentials.
  console.log(`Port: ${config.port}`);
  
  // Test database connection
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✓ Database connection established');
  } catch (error) {
    console.error('✗ Failed to connect to database:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    console.error('Make sure you have run: npm run prisma:generate && npm run prisma:migrate');
    throw error; // Re-throw to be caught by caller
  }

  return new Promise((resolve, reject) => {
    let serverStarted = false;
    
    const server = app.listen(config.port, () => {
      if (serverStarted) return; // Prevent duplicate calls
      serverStarted = true;
      console.log(`✓ API server running on port ${config.port}`);
      console.log(`✓ Database: ${config.databaseUrl}`);
      console.log(`✓ Scraper mode: ${config.scraperMode}`);
      console.log(`\nServer ready! API available at http://localhost:${config.port}`);
      resolve(app);
    });
    
    server.on('error', (err: NodeJS.ErrnoException) => {
      // Only reject if server hasn't started yet
      if (!serverStarted) {
        if (err.code === 'EADDRINUSE') {
          console.error(`\n✗ Port ${config.port} is already in use.`);
          console.error(`\nTo fix this, run one of the following:`);
          console.error(`  1. Find and kill the process: lsof -ti :${config.port} | xargs kill`);
          console.error(`  2. Or change the port: PORT=4001 npm run dev:server`);
          console.error(`  3. Or use a different port in your .env file: PORT=4001\n`);
        } else {
          console.error('✗ Server error:', err);
        }
        reject(err);
      } else {
        // Server already started, just log the error (shouldn't happen)
        console.warn('⚠ Server error after startup (server is still running):', err.message);
      }
    });
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server when this file is executed directly via tsx
// This file is the entry point, so we always start the server when executed
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  if (error instanceof Error) {
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
  }
  process.exit(1);
});
