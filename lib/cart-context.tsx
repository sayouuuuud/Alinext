'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { saveCartAction } from '@/lib/commerce/actions'
import type { CartLine } from '@/lib/commerce/types'

export type { CartLine } from '@/lib/commerce/types'

type CartContextValue = {
  lines: CartLine[]
  count: number
  ready: boolean
  syncing: boolean
  syncError: boolean
  add: (slug: string, quantity?: number) => void
  setQuantity: (slug: string, quantity: number) => void
  remove: (slug: string) => void
  clear: () => void
  quantityOf: (slug: string) => number
}

const CartContext = createContext<CartContextValue | null>(null)

function normalizeLines(lines: CartLine[]) {
  const quantities = new Map<string, number>()
  for (const line of lines) {
    if (!line.slug || !Number.isFinite(line.quantity)) continue
    quantities.set(
      line.slug,
      Math.min(99, (quantities.get(line.slug) || 0) + Math.max(1, Math.round(line.quantity))),
    )
  }
  return [...quantities].map(([slug, quantity]) => ({ slug, quantity }))
}

function mergeLines(saved: CartLine[], guest: CartLine[]) {
  return normalizeLines([...saved, ...guest])
}

export function CartProvider({
  children,
  initialLines = [],
}: {
  children: React.ReactNode
  initialLines?: CartLine[]
}) {
  const { signedIn } = useAuth()
  const normalizedInitial = useMemo(() => normalizeLines(initialLines), [initialLines])
  const [lines, setLines] = useState<CartLine[]>(normalizedInitial)
  const [syncError, setSyncError] = useState(false)
  const [syncing, startSync] = useTransition()
  const mounted = useRef(false)
  const wasSignedIn = useRef(signedIn)
  const lastSaved = useRef(JSON.stringify(normalizedInitial))

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }

    if (!signedIn) {
      if (wasSignedIn.current) {
        setLines([])
        lastSaved.current = '[]'
      }
      wasSignedIn.current = false
      return
    }

    const nextLines = wasSignedIn.current ? lines : mergeLines(normalizedInitial, lines)
    wasSignedIn.current = true
    if (nextLines !== lines) setLines(nextLines)

    const serialized = JSON.stringify(nextLines)
    if (serialized === lastSaved.current) return
    lastSaved.current = serialized
    setSyncError(false)
    startSync(async () => {
      const result = await saveCartAction(nextLines)
      if (result.status === 'error') {
        lastSaved.current = ''
        setSyncError(true)
      }
    })
  }, [lines, normalizedInitial, signedIn])

  const add = useCallback((slug: string, quantity = 1) => {
    setLines((current) => {
      const amount = Math.max(1, Math.round(quantity))
      const existing = current.find((line) => line.slug === slug)
      if (!existing) return [...current, { slug, quantity: Math.min(99, amount) }]
      return current.map((line) =>
        line.slug === slug
          ? { ...line, quantity: Math.min(99, line.quantity + amount) }
          : line,
      )
    })
  }, [])

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setLines((current) =>
      quantity < 1
        ? current.filter((line) => line.slug !== slug)
        : current.map((line) =>
            line.slug === slug
              ? { ...line, quantity: Math.min(99, Math.round(quantity)) }
              : line,
          ),
    )
  }, [])

  const remove = useCallback((slug: string) => {
    setLines((current) => current.filter((line) => line.slug !== slug))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartContextValue>(() => {
    const quantityOf = (slug: string) =>
      lines.find((line) => line.slug === slug)?.quantity ?? 0
    return {
      lines,
      count: lines.reduce((total, line) => total + line.quantity, 0),
      ready: true,
      syncing,
      syncError,
      add,
      setQuantity,
      remove,
      clear,
      quantityOf,
    }
  }, [lines, syncing, syncError, add, setQuantity, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside a CartProvider')
  return context
}
