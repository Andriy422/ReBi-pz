import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import FilterSidebar from '../components/catalog/FilterSidebar'
import CatalogCard from '../components/catalog/CatalogCard'
import Button from '../components/Button'
import { useCatalog } from '../hooks/useCatalog'
import { pluralModels } from '../utils/plural'
import { searchCatalog } from '../../application/useCases/catalog'
import { activeFilterChips, defaultFilters, removeFilterChip, sortOptions } from '../../domain/catalog/filters'
import './CatalogPage.css'

const VALID_TYPES = ['bike', 'moped', 'scooter']

function initialFilters(params) {
  const type = params.get('type')
  return {
    ...defaultFilters,
    types: VALID_TYPES.includes(type) ? [type] : [],
    query: params.get('q') ?? '',
  }
}

function Skeleton() {
  return (
    <div className="skeletons" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton skeleton--photo" />
          <div className="skeleton-col">
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line short" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CatalogPage() {
  const [params] = useSearchParams()
  const { models, loading, error } = useCatalog()
  const [filters, setFilters] = useState(() => initialFilters(params))
  const [sort, setSort] = useState('popular')
  const [panelOpen, setPanelOpen] = useState(false)

  const results = useMemo(() => searchCatalog(models, { filters, sort }), [models, filters, sort])
  const brands = useMemo(() => [...new Set(models.map((m) => m.brand))].sort(), [models])
  const quick = useMemo(() => [...models].sort((a, b) => b.popularity - a.popularity).slice(0, 4), [models])
  const chips = activeFilterChips(filters)

  const reset = () => setFilters(defaultFilters)

  return (
    <PageLayout>
      <div className="catalog">
        <header className="catalog__head">
          <h1>Каталог транспорту</h1>

          <form className="catalog__search" onSubmit={(e) => e.preventDefault()}>
            <input
              type="search"
              placeholder="Пошук за назвою або моделлю: Xiaomi, Rider X1, Kugoo…"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            />
            <Button type="submit">Знайти</Button>
          </form>

          {quick.length > 0 && (
            <div className="catalog__quick">
              <span>Швидкий вибір:</span>
              {quick.map((m) => (
                <button key={m.id} type="button" onClick={() => setFilters({ ...filters, query: m.name })}>
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="catalog__body">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            brands={brands}
            total={results.length}
            onReset={reset}
            onApply={() => setPanelOpen(false)}
            open={panelOpen}
          />

          <section className="catalog__results">
            <div className="catalog__bar">
              <button type="button" className="catalog__toggle" onClick={() => setPanelOpen(!panelOpen)}>
                {panelOpen ? 'Сховати фільтри' : 'Фільтри'}
              </button>

              <strong>
                {loading ? 'Завантаження…' : `Знайдено ${results.length} ${pluralModels(results.length)}`}
              </strong>

              <label className="catalog__sort">
                <span>Сортування:</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {chips.length > 0 && (
              <div className="catalog__chips">
                {chips.map((c) => (
                  <button key={c.id} type="button" onClick={() => setFilters(removeFilterChip(filters, c.id))}>
                    {c.label} ✕
                  </button>
                ))}
                <button type="button" className="catalog__clear" onClick={reset}>
                  Скинути все
                </button>
              </div>
            )}

            {loading && <Skeleton />}
            {error && <p className="catalog__note catalog__note--error">Не вдалося завантажити каталог</p>}

            {!loading && !error && results.length === 0 && (
              <div className="catalog__empty">
                <h2>Нічого не знайдено</h2>
                <p>Спробуйте змінити або скинути фільтри.</p>
                <Button type="button" onClick={reset}>
                  Скинути фільтри
                </Button>
              </div>
            )}

            <div className="catalog__list">
              {results.map((m) => (
                <CatalogCard key={m.id} model={m} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  )
}
