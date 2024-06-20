// src/database.js
const { sequelize, Contact } = require('./models');

const initDb = async () => {
  await sequelize.sync({ force: true });
  console.log("Database synced!");
};

module.exports = initDb;
