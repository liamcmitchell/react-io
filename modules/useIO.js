import {useEffect, useState, useContext} from 'react'
import {Context} from './context'
import {suspend} from './suspense'

class CacheEntry {
  constructor(observable, clean) {
    this.hasValue = false
    this.value = undefined
    this.hasError = false
    this.error = undefined
    this.subscribers = 0
    this.cleaned = false
    this.observable = observable
    this.clean = clean
    this.promise = new Promise((resolve) => {
      this.resolve = resolve
    })
    this.subscription = observable.subscribe({
      next: (value) => {
        this.hasValue = true
        this.value = value
        this.resolve()
      },
      error: (error) => {
        this.hasError = true
        this.error = error
        this.resolve()
      },
    })
  }

  subscribe(observer) {
    this.subscribers++
    const subscription = this.observable.subscribe(observer)
    return () => {
      this.subscribers--
      subscription.unsubscribe()
      this.checkClean()
    }
  }

  checkClean() {
    if (!this.cleaned && this.subscribers <= 0) {
      this.subscription.unsubscribe()
      this.clean()
    }
  }
}

// It is possible that we end up with cache entries with errors or no subscribers.
// We keep a reference of all caches so we can prune if needed.
/** @type {Set<Map<string, CacheEntry>} */
const caches = new Set()

export const pruneCache = () => {
  for (const cache of caches) {
    for (const [, cacheEntry] of cache) {
      cacheEntry.checkClean()
    }
  }
}

/** @return {CacheEntry} */
const getCacheEntry = (cacheKey, io, path, params) => {
  if (!io._cache) {
    io._cache = new Map()
    caches.add(io._cache)
  }
  /** @type {Map} */
  const cache = io._cache

  if (!cache.has(cacheKey)) {
    cache.set(
      cacheKey,
      new CacheEntry(io(path, params), () => cache.delete(cacheKey))
    )
  }

  return cache.get(cacheKey)
}

export const useIO = (path, params) => {
  const io = useContext(Context)

  // istanbul ignore next
  if (process.env.NODE_ENV !== 'production' && !io) {
    throw new Error('io not defined')
  }

  if (path === undefined) {
    return io
  }

  // istanbul ignore next
  if (
    process.env.NODE_ENV !== 'production' &&
    params &&
    typeof params !== 'object'
  ) {
    throw new Error(
      'Params must be an object. Are you trying to use a non-OBSERVE method? Only OBSERVE requests can be made using useIO: useIO(path, params)'
    )
  }

  // Allow rendering immediately by passing a starting value as startWith.
  let startWith
  const hasStartWith =
    params && Object.prototype.hasOwnProperty.call(params, 'startWith')

  // Allow returning state wrapper - {value, loading, error}.
  let returnStateWrapper
  const hasReturnStateWrapper =
    params && Object.prototype.hasOwnProperty.call(params, 'returnStateWrapper')

  // Extract these options from the params passed to io.
  if (hasStartWith || hasReturnStateWrapper) {
    const {
      startWith: _startWith,
      returnStateWrapper: _returnStateWrapper,
      ...other
    } = params

    startWith = _startWith
    returnStateWrapper = _returnStateWrapper
    params = other
  }

  const cacheKey = path + (params ? JSON.stringify(params) : '')

  const cacheEntry = getCacheEntry(cacheKey, io, path, params)

  if (cacheEntry.hasValue) {
    startWith = cacheEntry.value
  }

  // State is only needed to trigger render.
  // Actual values are taken from cacheEntry.
  const [, setState] = useState(startWith)

  // Subscribe to changes.
  useEffect(() => {
    // Reset state, noop if identical.
    setState(startWith)

    // cacheEntry used in render may have been removed. Need to get again.
    return getCacheEntry(cacheKey, io, path, params).subscribe({
      next: setState,
      // Changing state will trigger rerender and the error will be thrown
      // from the cacheEntry object.
      // This relies on errors being different to values...
      error: setState,
    })
  }, [cacheKey, io])

  if (returnStateWrapper) {
    return {
      loading: !cacheEntry.hasValue && !cacheEntry.hasError,
      value: cacheEntry.hasValue ? cacheEntry.value : startWith,
      error: cacheEntry.hasError ? cacheEntry.error : undefined,
    }
  } else {
    if (cacheEntry.hasError) {
      throw cacheEntry.error
    } else if (cacheEntry.hasValue) {
      return cacheEntry.value
    } else if (hasStartWith) {
      return startWith
    } else {
      return suspend(cacheEntry.promise)
    }
  }
}
