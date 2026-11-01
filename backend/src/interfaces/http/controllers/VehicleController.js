// INTERFACES: перетворює HTTP-запит на виклик сценарію і формує відповідь.
class VehicleController {
  constructor({ listAvailableVehicles }) {
    this.listAvailableVehicles = listAvailableVehicles;
  }

  list = async (req, res, next) => {
    try {
      const vehicles = await this.listAvailableVehicles.execute();
      res.json(vehicles.map(toDto));
    } catch (err) {
      next(err);
    }
  };
}

function toDto(v) {
  return {
    id: v.id,
    type: v.type,
    batteryLevel: v.batteryLevel,
    status: v.status,
    lat: v.lat,
    lng: v.lng,
  };
}

module.exports = { VehicleController };
