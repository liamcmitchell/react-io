import {useEffect, useState, useContext} from 'react'
import {Context} from './context'
import {suspend} from './suspense'

class CacheEntry {
  /**
   * @param {import('rxjs').Observable} observable
   * @param {Map<string, CacheEntry>} cache
   * @param {string} cacheKey
   **/
  constructor(observable, cache, cacheKey) {
    this.hasValue = false
    this.value = undefined
    this.hasError = false
    this.error = undefined
    this.subscribed = false
    this.subscribers = 0
    this.observable = observable
    this.cache = cache
    this.cacheKey = cacheKey
    this.cleanTimeout = undefined
    this.promise = new Promise((resolve) => {
      this.resolve = resolve
    })
    this.subscription = observable.subscribe({
      next: (value) => {
        this.hasValue = true
        this.value = value
        this.resolve()
        this.clean()
      },
      error: (error) => {
        this.hasError = true
        this.error = error
        this.resolve()
        this.clean()
      },
    })
  }

  subscribe(observer) {
    clearTimeout(this.cleanTimeout)
    this.subscribed = true
    this.subscribers++
    const subscription = this.observable.subscribe(observer)
    return () => {
      this.subscribers--
      subscription.unsubscribe()
      this.clean()
    }
  }

  clean(force) {
    clearTimeout(this.cleanTimeout)

    if (
      // On server we won't have subscribers so clean immediately.
      typeof window === 'undefined' ||
      // If we have reached timeout and still don't have subscriptions, clean.
      (force && this.subscribers <= 0)
    ) {
      this.subscription.unsubscribe()
      // On client, remove from cache to avoid stale data on next use.
      // istanbul ignore else
      if (typeof window !== 'undefined') {
        this.cache.delete(this.cacheKey)
      }
    } else if (this.subscribed && this.subscribers <= 0) {
      // If we have subscribed, wait a small timeout for resubscription.
      this.cleanTimeout = setTimeout(() => {
        this.clean(true)
      }, 100)
    }
  }
}

/** @return {CacheEntry} */
const getCacheEntry = (cacheKey, io, path, params) => {
  io._cache ??= new Map()
  /** @type {Map} */
  const cache = io._cache

  if (!cache.has(cacheKey)) {
    cache.set(cacheKey, new CacheEntry(io(path, params), cache, cacheKey))
  }

  return cache.get(cacheKey)
}

export const useIO = (path, params) => {
  const io = useContext(Context)

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
