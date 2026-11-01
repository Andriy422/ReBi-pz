const express = require('express');

function createRoutes({ vehicleController, healthController }) {
  const router = express.Router();
  router.get('/health', healthController.check);
  router.get('/vehicles', vehicleController.list);
  return router;
}

module.exports = { createRoutes };
