const express = require('express');

function createRoutes({ vehicleController, healthController, modelController }) {
  const router = express.Router();
  router.get('/health', healthController.check);
  router.get('/vehicles', vehicleController.list);
  router.get('/models/popular', modelController.popular);
  return router;
}

module.exports = { createRoutes };
