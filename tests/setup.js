const sequelize = require('../src/config/database');

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_secret';
  process.env. DB_NAME = 'library_test_db';
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  const tables = Object.keys(sequelize.models);
  for (const table of tables) {
    await sequelize.models[table].destroy({ where: {}, force: true });
  }
});