import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import 'dotenv/config';

import { seedCategories } from './seeders/CategorySeeder';
import { seedTables } from './seeders/TableSeeder';
import { seedUsers } from './seeders/UserSeeder';
import { seedMenus } from './seeders/MenuSeeder';
import { seedPromos } from './seeders/PromoSeeder';
import { seedActiveData } from './seeders/ActiveDataSeeder';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}
const dbUrl = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, ''),
  connectionLimit: 20,
  connectTimeout: 30000,
});
const prisma = new PrismaClient({ adapter });

async function cleanDatabase() {
  console.log('🗑️ Cleaning database...');

  // Delete in reverse order of dependencies
  await prisma.delivery.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.promo.deleteMany();
  await prisma.guestSession.deleteMany();
  await prisma.user.deleteMany();

  console.log('✨ Database cleaned');
}

async function main() {
  try {
    console.log('🚀 Start seeding...');

    await cleanDatabase();

    // Eksekusi seeder inti (Production & Development)
    await seedCategories(prisma);
    await seedTables(prisma);
    await seedUsers(prisma);

    // Selalu jalankan seeder menu (baik Production maupun Development)
    console.log('📦 Seeding menus...');
    await seedMenus(prisma);

    await seedPromos(prisma);

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Development Mode: Seeding active orders & carts...');
      await seedActiveData(prisma);
    }

    console.log('🏁 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
