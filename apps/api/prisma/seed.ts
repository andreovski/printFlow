import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('123456', 6);

  const org = await prisma.organization.create({
    data: {
      name: 'Acme Print Shop',
      ownerId: 'temp-owner-id', // Will update after user creation
    },
  });

  const user = await prisma.user.create({
    data: {
      name: 'Master',
      email: 'admin@acme.com',
      passwordHash,
      role: 'MASTER',
      organizationId: org.id,
    },
  });

  await prisma.organization.update({
    where: { id: org.id },
    data: { ownerId: user.id },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
