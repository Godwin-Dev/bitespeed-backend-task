// src/app.js
const express = require('express');
const bodyParser = require('body-parser');
const initDb = require('./database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(bodyParser.json());
app.use('/', routes);

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
