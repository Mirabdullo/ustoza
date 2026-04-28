import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  const categories = [
    { key: 'topik1', title: 'TOPIK I test',  order: 1 },
    { key: 'topik2', title: 'TOPIK II test', order: 2 },
    { key: 'mock',   title: 'Mock test',     order: 3 },
    { key: 'lugat',  title: "Lug'atlar",     order: 4 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { key: cat.key },
      update: {},
      create: cat,
    });
  }

  const topik1 = await prisma.category.findUnique({ where: { key: 'topik1' } });
  const topik2 = await prisma.category.findUnique({ where: { key: 'topik2' } });
  const mock   = await prisma.category.findUnique({ where: { key: 'mock' } });
  const lugat  = await prisma.category.findUnique({ where: { key: 'lugat' } });

  const subs = [
    { categoryId: topik1.id, key: 'topik1_t1', title: '1-test', order: 1 },
    { categoryId: topik1.id, key: 'topik1_t2', title: '2-test', order: 2 },
    { categoryId: topik1.id, key: 'topik1_t3', title: '3-test', order: 3 },
    { categoryId: topik2.id, key: 'topik2_t1', title: '1-test', order: 1 },
    { categoryId: topik2.id, key: 'topik2_t2', title: '2-test', order: 2 },
    { categoryId: topik2.id, key: 'topik2_t3', title: '3-test', order: 3 },
    { categoryId: mock.id,   key: 'mock_1',    title: 'Mock 1', order: 1 },
    { categoryId: mock.id,   key: 'mock_2',    title: 'Mock 2', order: 2 },
    { categoryId: lugat.id,  key: 'lugat_1',   title: "TOPIK I lug'at",  order: 1 },
    { categoryId: lugat.id,  key: 'lugat_2',   title: "TOPIK II lug'at", order: 2 },
  ];

  for (const sub of subs) {
    await prisma.subcategory.upsert({
      where: { categoryId_key: { categoryId: sub.categoryId, key: sub.key } },
      update: {},
      create: sub,
    });
  }

  console.log('✅ Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
