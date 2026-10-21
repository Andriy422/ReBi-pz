const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('ReBi API Працює!'));
app.listen(5000, () => console.log('Backend running on port 5000'));