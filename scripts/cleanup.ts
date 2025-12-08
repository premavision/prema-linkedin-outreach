import 'dotenv/config';
import { prisma } from '../src/infra/persistence/prismaClient.js';

async function main() {
  await prisma.target.deleteMany({
    where: {
      linkedinUrl: 'https://www.linkedin.com/in/valid-row'
    }
  });
  console.log('Cleaned up test record.');
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
