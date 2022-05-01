import {useEffect, useState, useContext} from 'react'
import {Context} from './context'
import {take} from 'rxjs/operators'
import {suspend} from './suspense'

const LOADING = {}

export const useIO = (path, params) => {
  const io = useContext(Context)

  if (path === undefined) {
    return io
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    params &&
    typeof params !== 'object'
  ) {
    throw new Error(
      'Params must be an object. Are you trying to use a non-OBSERVE method? Only OBSERVE requests can be made using useIO: useIO(path, params)'
    )
  }

  let [value, setValue] = useState(LOADING)
  let [error, setError] = useState(LOADING)

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

  // Try to get value synchronously.
  // Can't save any subscriptions during render.
  // io requests should be cached so resubscribing should be harmless.
  let firstValue$
  if (value === LOADING && error === LOADING) {
    firstValue$ = io(path, params).pipe(take(1))

    firstValue$
      .subscribe({
        next: (_value) => {
          value = _value
        },
        error: (_error) => {
          error = _error
        },
      })
      .unsubscribe()
  }

  // Set up persistent subscription.
  useEffect(() => {
    // Reset state, noop if identical.
    setValue(LOADING)
    setError(LOADING)

    const subscription = io(path, params).subscribe({
      next: setValue,
      error: setError,
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [path, params && JSON.stringify(params)])

  if (returnStateWrapper) {
    return {
      loading: value === LOADING && error === LOADING,
      value: value === LOADING ? startWith : value,
      error: error === LOADING ? undefined : error,
    }
  } else {
    if (error !== LOADING) {
      throw error
    } else if (value !== LOADING) {
      return value
    } else if (hasStartWith) {
      return startWith
    } else {
      return suspend(firstValue$.toPromise().catch(setError))
    }
  }
}
