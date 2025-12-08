import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../src/infra/persistence/prismaClient.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Allow passing filename as argument, default to batch 1
  const filename = process.argv[2] || 'demo_batch_1.csv';
  
  let csvPath = path.resolve(filename);
  // If file doesn't exist at resolved path, try looking in ../data/
  if (!fs.existsSync(csvPath)) {
    csvPath = path.join(__dirname, '../data', filename);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading targets from ${csvPath}...`);

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  
  const targets: any[] = [];
  const errors: string[] = [];

  // Parse CSV (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',');
    
    // Basic validation
    if (values.length < 4) {
      errors.push(`Line ${i + 1}: Missing columns (expected 4, got ${values.length}) - "${line}"`);
      continue;
    }

    const [name, linkedinUrl, role, company] = values.map(v => v.trim());

    if (!linkedinUrl || !linkedinUrl.startsWith('http')) {
       errors.push(`Line ${i + 1}: Invalid LinkedIn URL - "${linkedinUrl}"`);
       continue;
    }

    targets.push({
      name,
      linkedinUrl,
      role,
      company,
    });
  }

  if (errors.length > 0) {
    console.warn(`\n⚠️  Found ${errors.length} invalid rows (skipping):`);
    errors.forEach(e => console.warn(`  ${e}`));
    console.log('');
  }

  console.log(`Seeding ${targets.length} valid targets...`);

  for (let i = 0; i < targets.length; i++) {
    const targetData = targets[i];
    
    // For the first 3 targets of ANY batch, we'll simulate they are already scraped
    const isScraped = i < 3;
    const status = isScraped ? 'PROFILE_SCRAPED' : 'NOT_VISITED';

    try {
      const target = await prisma.target.upsert({
        where: { linkedinUrl: targetData.linkedinUrl },
        update: {
          ...targetData,
          status: status 
        },
        create: {
          ...targetData,
          status: status
        },
      });

      if (isScraped) {
        await prisma.profileSnapshot.upsert({
          where: { targetId: target.id },
          update: {},
          create: {
            targetId: target.id,
            headline: `${targetData.role} at ${targetData.company}`,
            about: `Passionate ${targetData.role} helping companies grow.`,
            currentRole: targetData.role,
            company: targetData.company,
            location: 'San Francisco Bay Area',
            industry: 'Technology',
            rawHtml: '<html><body>Mock Profile</body></html>'
          }
        });
        console.log(`  Processed ${target.name} (SCRAPED)`);
      } else {
        console.log(`  Processed ${target.name} (NOT_VISITED)`);
      }
    } catch (err) {
      console.error(`  Error processing ${targetData.name}:`, err);
    }
  }

  const total = await prisma.target.count();
  console.log(`\nSeed complete. Targets table now has ${total} records.`);
}

main()
  .catch((err) => {
    console.error('Failed to seed targets:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
