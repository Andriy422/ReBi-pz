// COMPOSITION ROOT: єдине місце, де зв'язуються всі шари.
const { Database } = require('./infrastructure/db/Database');
const { PgVehicleRepository } = require('./infrastructure/repositories/PgVehicleRepository');
const { ListAvailableVehicles } = require('./application/use-cases/ListAvailableVehicles');
const { CheckHealth } = require('./application/use-cases/CheckHealth');
const { VehicleController } = require('./interfaces/http/controllers/VehicleController');
const { HealthController } = require('./interfaces/http/controllers/HealthController');
const { createApp } = require('./interfaces/http/createApp');

const database = new Database(process.env.DATABASE_URL);
const vehicleRepository = new PgVehicleRepository({ database });

const listAvailableVehicles = new ListAvailableVehicles({ vehicleRepository });
const checkHealth = new CheckHealth({ database });

const app = createApp({
  vehicleController: new VehicleController({ listAvailableVehicles }),
  healthController: new HealthController({ checkHealth }),
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
