import 'dotenv/config';
import { prisma } from '../src/infra/persistence/prismaClient.js';

const SAMPLE_TARGETS = [
  {
    name: 'Avery Chen',
    linkedinUrl: 'https://www.linkedin.com/in/avery-chen-growth',
    role: 'Head of Growth',
    company: 'Lambda AI',
  },
  {
    name: 'Marcus Patel',
    linkedinUrl: 'https://www.linkedin.com/in/marcus-patel-ops',
    role: 'Revenue Operations Lead',
    company: 'Northwind Robotics',
  },
  {
    name: 'Sofia Alvarez',
    linkedinUrl: 'https://www.linkedin.com/in/sofia-alvarez-labs',
    role: 'VP Partnerships',
    company: 'Atlas Labs',
  },
  {
    name: 'Noah Ibrahim',
    linkedinUrl: 'https://www.linkedin.com/in/noah-ibrahim',
    role: 'Director of Product Marketing',
    company: 'Crescendo Health',
  },
  {
    name: 'Priya Raman',
    linkedinUrl: 'https://www.linkedin.com/in/priya-raman-ai',
    role: 'Chief Customer Officer',
    company: 'Helix Cloud',
  },
];

async function main() {
  console.log(`Seeding ${SAMPLE_TARGETS.length} sample targets...`);

  for (const target of SAMPLE_TARGETS) {
    await prisma.target.upsert({
      where: { linkedinUrl: target.linkedinUrl },
      update: target,
      create: target,
    });
  }

  const total = await prisma.target.count();

  console.log(`Seed complete. Targets table now has ${total} records.`);
}

main()
  .catch((err) => {
    console.error('Failed to seed targets:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

