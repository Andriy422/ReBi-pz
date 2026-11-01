const express = require('express');
const cors = require('cors');
const { createRoutes } = require('./routes');

function createApp(controllers) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/', (req, res) => res.send('ReBi API Працює!'));
  app.use('/api', createRoutes(controllers));

  // єдиний обробник помилок
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  });

  return app;
}

module.exports = { createApp };
