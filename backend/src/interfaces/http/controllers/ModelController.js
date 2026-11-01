class ModelController {
  constructor({ listPopularModels }) {
    this.listPopularModels = listPopularModels;
  }

  popular = async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 3, 12);
      const models = await this.listPopularModels.execute({ limit });
      res.json(models);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { ModelController };
