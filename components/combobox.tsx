'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

export interface Option {
  value: string
  label: string
  /** Right-hand context: a country for a city, a group for a niche. */
  hint?: string
  /** Extra searchable terms — aliases, so "Bangalore" finds Bengaluru. */
  terms?: string[]
  /** Optional grouping header. */
  section?: string
}

interface Props {
  label: string
  options: Option[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  error?: string
  description?: string
  emptyMessage?: string
}

function normalise(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * A searchable single-select.
 *
 * Built rather than pulled in because it has to do one specific thing well:
 * search across aliases, so someone who thinks of their city as Bangalore or
 * Gurgaon finds it under the name we store. Keyboard and screen-reader
 * behaviour follows the ARIA combobox pattern.
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Start typing…',
  error,
  description,
  emptyMessage = 'Nothing matches that.',
}: Props) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value])

  const matches = useMemo(() => {
    const q = normalise(query)
    if (!q) return options.slice(0, 80)
    const scored: { option: Option; score: number }[] = []
    for (const option of options) {
      const haystacks = [option.label, ...(option.terms ?? [])]
      let best = 0
      for (const raw of haystacks) {
        const h = normalise(raw)
        if (h === q) best = Math.max(best, 100)
        else if (h.startsWith(q)) best = Math.max(best, 80)
        else if (h.includes(q)) best = Math.max(best, 50)
      }
      if (best > 0) scored.push({ option, score: best })
    }
    return scored
      .sort((a, b) => b.score - a.score || a.option.label.length - b.option.label.length)
      .slice(0, 80)
      .map((s) => s.option)
  }, [options, query])

  useEffect(() => {
    setActive(0)
  }, [query])

  // Close when focus or a click leaves the component.
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  // Keep the highlighted option in view during keyboard navigation.
  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  // On a phone, tapping a field near the bottom of the page opens the list
  // below the fold — and then the software keyboard covers what is left of it.
  // Pull the field up so its options have somewhere to go.
  useEffect(() => {
    if (!open) return
    const input = wrapperRef.current
    if (!input) return
    const id = window.setTimeout(() => {
      const rect = input.getBoundingClientRect()
      // Roughly what is left once a keyboard takes the bottom half.
      const usable = window.innerHeight * 0.45
      if (rect.bottom > usable) {
        window.scrollBy({ top: rect.top - 88, behavior: 'smooth' })
      }
    }, 50)
    return () => window.clearTimeout(id)
  }, [open])

  function choose(option: Option) {
    onChange(option.value)
    setQuery('')
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => {
        if (matches.length === 0) return 0
        return (current + delta + matches.length) % matches.length
      })
      return
    }
    if (event.key === 'Enter') {
      if (open && matches[active]) {
        event.preventDefault()
        choose(matches[active])
      }
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'Backspace' && !query && selected) {
      onChange(null)
    }
  }

  const listId = `${id}-list`
  const describedBy = [description ? `${id}-desc` : null, error ? `${id}-err` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={id} className="label">
        {label}
      </label>

      {description ? (
        <p id={`${id}-desc`} className="mb-2 text-[13px] text-bone-faint">
          {description}
        </p>
      ) : null}

      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${id}-opt-${active}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          autoComplete="off"
          className={`field pr-10 ${error ? 'border-flag/70' : ''}`}
          placeholder={selected ? selected.label : placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />

        {selected && !query ? (
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-bone-faint hover:text-bone"
            aria-label={`Clear ${label}`}
          >
            Clear
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-bone-faint"
          >
            ▾
          </span>
        )}
      </div>

      {selected && !open ? (
        <p className="mt-2 text-[13px] text-verified">Selected: {selected.label}</p>
      ) : null}

      {error ? (
        <p id={`${id}-err`} className="mt-2 text-[13px] text-flag">
          {error}
        </p>
      ) : null}

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-ink-soft
                     bg-ink-card py-1 shadow-2xl shadow-black/60"
        >
          {matches.length === 0 ? (
            <li className="px-4 py-3 text-[14px] text-bone-faint">{emptyMessage}</li>
          ) : (
            matches.map((option, index) => (
              <li key={option.value}>
                <button
                  type="button"
                  id={`${id}-opt-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={option.value === value}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(option)}
                  className={`flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left text-[14px]
                              transition-colors ${
                                index === active ? 'bg-ink-soft text-bone' : 'text-bone-dim'
                              }`}
                >
                  <span className="truncate">{option.label}</span>
                  {option.hint ? (
                    <span className="shrink-0 text-[12px] text-bone-faint">{option.hint}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
