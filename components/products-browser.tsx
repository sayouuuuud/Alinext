'use client'

import { useMemo, useState } from 'react'
import { BadgeCheck, Search, ShieldCheck, Truck, X } from 'lucide-react'

import { Paginator } from '@/components/paginator'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CatalogCategory, PartSummary } from '@/lib/data/parts'
import { useLanguage } from '@/lib/i18n/language-context'

const PAGE_SIZE = 8

type SortKey = 'featured' | 'priceAsc' | 'priceDesc' | 'nameAsc'

type ProductsBrowserProps = {
  parts: PartSummary[]
  categories: CatalogCategory[]
}

export function ProductsBrowser({ parts, categories }: ProductsBrowserProps) {
  const { t, locale } = useLanguage()
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [subcategoryId, setSubcategoryId] = useState('all')
  const [sort, setSort] = useState<SortKey>('featured')
  const [page, setPage] = useState(1)

  const mainCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories],
  )
  const subcategories = useMemo(
    () =>
      categoryId === 'all'
        ? []
        : categories.filter((category) => category.parentId === categoryId),
    [categories, categoryId],
  )

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale)
    const filtered = parts.filter((part) => {
      if (categoryId !== 'all' && part.categoryId !== categoryId) return false
      if (subcategoryId !== 'all' && part.subcategoryId !== subcategoryId) return false
      if (!needle) return true

      const haystack = [
        part.name.ar,
        part.name.he,
        part.name.en,
        part.categoryName.ar,
        part.categoryName.he,
        part.categoryName.en,
        part.subcategoryName?.ar,
        part.subcategoryName?.he,
        part.subcategoryName?.en,
        part.brand,
        part.sku,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase(locale)
      return haystack.includes(needle)
    })

    const sorted = [...filtered]
    if (sort === 'priceAsc') sorted.sort((a, b) => a.price - b.price)
    else if (sort === 'priceDesc') sorted.sort((a, b) => b.price - a.price)
    else if (sort === 'nameAsc') {
      sorted.sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale))
    } else {
      sorted.sort(
        (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
      )
    }
    return sorted
  }, [parts, query, categoryId, subcategoryId, sort, locale])

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const hasFilters =
    query.trim() !== '' || categoryId !== 'all' || subcategoryId !== 'all'

  const sortOptions: { label: string; value: SortKey }[] = [
    { label: t.common.featured, value: 'featured' },
    { label: t.common.priceAsc, value: 'priceAsc' },
    { label: t.common.priceDesc, value: 'priceDesc' },
    { label: t.common.nameAsc, value: 'nameAsc' },
  ]

  const trust = [
    { icon: ShieldCheck, label: t.products.trustWarranty },
    { icon: Truck, label: t.products.trustShipping },
    { icon: BadgeCheck, label: t.products.trustGenuine },
  ]

  const selectCategory = (nextCategoryId: string) => {
    setCategoryId(nextCategoryId)
    setSubcategoryId('all')
    setPage(1)
  }

  const clearFilters = () => {
    setQuery('')
    setCategoryId('all')
    setSubcategoryId('all')
    setPage(1)
  }

  const goToPage = (nextPage: number) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {trust.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <item.icon className="size-4 text-accent" aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <section className="mx-auto mt-10 max-w-7xl px-4 pb-24 md:px-8">
        <div className="flex flex-col gap-4 rounded-3xl bg-card p-4 ring-1 ring-border md:flex-row md:items-center md:p-5">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute inset-y-0 start-4 my-auto size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              placeholder={t.products.searchPlaceholder}
              aria-label={t.common.search}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              className="h-12 rounded-full pe-4 ps-11"
            />
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="sort"
              className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              {t.common.sortBy}
            </label>
            <Select
              items={sortOptions}
              value={sort}
              onValueChange={(value) => value && setSort(value as SortKey)}
            >
              <SelectTrigger id="sort" aria-label={t.common.sortBy} className="h-12 min-w-44 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className="mt-6 flex flex-wrap items-center gap-2"
          aria-label={t.products.categoriesLabel}
        >
          <Button
            type="button"
            size="lg"
            variant={categoryId === 'all' ? 'default' : 'outline'}
            onClick={() => selectCategory('all')}
            aria-pressed={categoryId === 'all'}
            className="rounded-full"
          >
            {t.common.all}
          </Button>
          {mainCategories.map((category) => (
            <Button
              key={category.id}
              type="button"
              size="lg"
              variant={categoryId === category.id ? 'default' : 'outline'}
              onClick={() => selectCategory(category.id)}
              aria-pressed={categoryId === category.id}
              className="rounded-full"
            >
              {category.name[locale] || category.name.en || category.slug}
            </Button>
          ))}
        </div>

        {subcategories.length > 0 && (
          <div
            className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-secondary p-3"
            aria-label={`${t.products.categoriesLabel}: ${mainCategories.find((category) => category.id === categoryId)?.name[locale] || ''}`}
          >
            <Button
              type="button"
              size="sm"
              variant={subcategoryId === 'all' ? 'secondary' : 'ghost'}
              onClick={() => {
                setSubcategoryId('all')
                setPage(1)
              }}
              aria-pressed={subcategoryId === 'all'}
              className="rounded-full"
            >
              {t.common.all}
            </Button>
            {subcategories.map((subcategory) => (
              <Button
                key={subcategory.id}
                type="button"
                size="sm"
                variant={subcategoryId === subcategory.id ? 'secondary' : 'ghost'}
                onClick={() => {
                  setSubcategoryId(subcategory.id)
                  setPage(1)
                }}
                aria-pressed={subcategoryId === subcategory.id}
                className="rounded-full"
              >
                {subcategory.name[locale] || subcategory.name.en || subcategory.slug}
              </Button>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span dir="ltr">{visible.length}</span> {t.common.resultsCount}
          </p>
          {hasFilters && (
            <Button type="button" variant="link" onClick={clearFilters}>
              <X data-icon="inline-start" aria-hidden="true" />
              {t.common.clearFilters}
            </Button>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-card p-12 text-center ring-1 ring-border">
            <p className="text-base text-muted-foreground">{t.common.noResults}</p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paged.map((part) => (
                <ProductCard key={part.slug} part={part} />
              ))}
            </div>

            {totalPages > 1 && (
              <Paginator
                current={safePage}
                total={totalPages}
                onChange={goToPage}
                prevLabel={t.common.prevPage}
                nextLabel={t.common.nextPage}
              />
            )}
          </>
        )}
      </section>
    </>
  )
}
