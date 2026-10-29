import { Prisma, PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@travelplanner.com' },
    update: {},
    create: {
      username: 'Admin',
      email: 'admin@travelplanner.com',
      passwordHash: await argon2.hash('Admin123'),
      role: 'ADMIN',
    },
  });

  const traveller = await prisma.user.upsert({
    where: { email: 'traveller@travelplanner.com' },
    update: {},
    create: {
      username: 'Traveller',
      email: 'traveller@travelplanner.com',
      passwordHash: await argon2.hash('Password123'),
      role: 'USER',
    },
  });

  const existingTripItaly = await prisma.trip.findFirst({
    where: { userId: traveller.id, title: 'Trip to Italy' },
  });

  if (!existingTripItaly) {
    await prisma.trip.create({
      data: {
        userId: traveller.id,
        title: 'Trip to Italy',
        country: 'Italy',
        city: 'Rome',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-07'),
        budget: new Prisma.Decimal(3000.0),
        expenses: {
          create: [
            {
              title: 'Nannarella',
              amount: new Prisma.Decimal(50.0),
              category: 'FOOD',
            },
          ],
        },
      },
    });
  }

  const existingTripUsa = await prisma.trip.findFirst({
    where: { userId: traveller.id, title: 'My planned trip to the USA' },
  });

  if (!existingTripUsa) {
    await prisma.trip.create({
      data: {
        userId: traveller.id,
        title: 'My planned trip to the USA',
        country: 'USA',
        city: 'New York',
        startDate: new Date('2026-12-28'),
        endDate: new Date('2027-01-04'),
        budget: new Prisma.Decimal(4350.0),
        expenses: {
          create: [
            {
              title: 'Times Square Hotel',
              amount: new Prisma.Decimal(1250.0),
              category: 'ACCOMMODATION',
            },
            {
              title: 'SUMMIT One Vanderbilt ticket',
              amount: new Prisma.Decimal(45.0),
              category: 'ENTERTAINMENT',
            },
            {
              title: "Joe's Pizza Broadway",
              amount: new Prisma.Decimal(25.5),
              category: 'FOOD',
            },
            {
              title: 'MTA Subway 7-Day Pass',
              amount: new Prisma.Decimal(34.0),
              category: 'TRANSPORT',
            },
          ],
        },
      },
    });
  }

  const existingTripJapan = await prisma.trip.findFirst({
    where: { userId: traveller.id, title: 'Tokyo Autumn Exploration 2025' },
  });

  if (!existingTripJapan) {
    await prisma.trip.create({
      data: {
        userId: traveller.id,
        title: 'Tokyo Autumn Exploration 2025',
        country: 'Japan',
        city: 'Tokyo',
        startDate: new Date('2025-09-29'),
        endDate: new Date('2025-10-05'),
        budget: new Prisma.Decimal(2740.0),
        expenses: {
          create: [
            {
              title: 'Shinjuku Granbell Hotel',
              amount: new Prisma.Decimal(750.0),
              category: 'ACCOMMODATION',
            },
            {
              title: 'Japan Rail Pass (7 Days)',
              amount: new Prisma.Decimal(340.0),
              category: 'TRANSPORT',
            },
            {
              title: 'Ichiran Ramen Shinjuku',
              amount: new Prisma.Decimal(18.5),
              category: 'FOOD',
            },
            {
              title: 'TeamLab Planets ticket',
              amount: new Prisma.Decimal(28.0),
              category: 'ENTERTAINMENT',
            },
            {
              title: 'Akihabara Gaming Merch',
              amount: new Prisma.Decimal(120.0),
              category: 'OTHER',
            },
            {
              title: 'Shibuya Sky Observatory',
              amount: new Prisma.Decimal(15.0),
              category: 'ENTERTAINMENT',
            },
          ],
        },
      },
    });
  }

  console.log('Database seeded successfully');
  console.log('Admin: admin@travelplanner.com (Password: Admin123)');
  console.log('Traveller: traveller@travelplanner.com (Password: Password123)');
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
