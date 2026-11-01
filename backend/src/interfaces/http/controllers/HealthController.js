class HealthController {
  constructor({ checkHealth }) {
    this.checkHealth = checkHealth;
  }

  check = async (req, res) => {
    try {
      res.json(await this.checkHealth.execute());
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'db_error' });
    }
  };
}

module.exports = { HealthController };
