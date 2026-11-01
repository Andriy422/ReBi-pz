// APPLICATION: сценарій «показати вільний транспорт».
// Залежить лише від порту репозиторію, який йому передають ззовні.
class ListAvailableVehicles {
  constructor({ vehicleRepository }) {
    this.vehicleRepository = vehicleRepository;
  }

  async execute() {
    const vehicles = await this.vehicleRepository.findAvailable();
    return vehicles.filter((v) => v.isAvailable());
  }
}

module.exports = { ListAvailableVehicles };
