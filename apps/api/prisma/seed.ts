import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('123456', 6);

  // First, check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@acme.com' },
    include: { organization: true },
  });

  if (existingUser) {
    console.log('Seed data already exists:');
    console.log('Email: admin@acme.com');
    console.log('Password: 123456');
    console.log('Organization:', existingUser.organization?.name || 'N/A');
    console.log('Organization ID:', existingUser.organizationId || 'N/A');
    return;
  }

  // Create new organization and user
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

  console.log('✅ Created Admin User:');
  console.log('Email: admin@acme.com');
  console.log('Password: 123456');
  console.log('Organization: Acme Print Shop');
  console.log('Organization ID:', org.id);
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
