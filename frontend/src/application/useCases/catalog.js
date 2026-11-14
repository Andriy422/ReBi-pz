// APPLICATION: сценарії каталогу.
import { applyFilters, sortModels } from '../../domain/catalog/filters'

export function makeGetCatalog({ catalogRepository }) {
  return () => catalogRepository.findAll()
}

export function makeGetCatalogItem({ catalogRepository }) {
  return (id) => catalogRepository.findById(id)
}

// «Пошук у каталозі»: фільтри + сортування (чиста функція)
export function searchCatalog(models, { filters, sort }) {
  return sortModels(applyFilters(models, filters), sort)
}
