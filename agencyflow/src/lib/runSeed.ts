import { seedDatabase } from './seedData';

seedDatabase()
  .then(() => {
    console.log('Seeding finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
