// APPLICATION: сценарій «перевірити, що система жива».
class CheckHealth {
  constructor({ database }) {
    this.database = database;
  }

  async execute() {
    await this.database.ping();
    return { status: 'ok' };
  }
}

module.exports = { CheckHealth };
