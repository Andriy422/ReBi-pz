const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/', (req, res) => res.send('ReBi API Працює!'));

// перевірка, що бекенд і база живі
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'db_error' });
  }
});

// вільний транспорт (поки без фільтрів)
app.get('/api/vehicles', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, type, battery_level, status, lat, lng FROM vehicles WHERE status = 'available' ORDER BY id"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
