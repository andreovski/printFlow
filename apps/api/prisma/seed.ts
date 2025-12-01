import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('123456', 6);

  const org = await prisma.organization.upsert({
    where: { id: '0193a1b2-3c4d-5e6f-7g8h-9i0j1k2l3m4n5o' },
    update: {},
    create: {
      id: '0193a1b2-3c4d-5e6f-7g8h-9i0j1k2l3m4n5o',
      name: 'Acme Print Shop',
      ownerId: 'temp-owner-id',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
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
