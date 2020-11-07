import {useEffect, useState, useContext} from 'react'
import {Context} from './context'
import {take} from 'rxjs/operators'
import {suspend} from './suspense'

const WAITING = {}

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

  const [error, setError] = useState(WAITING)
  if (error !== WAITING) {
    throw error
  }

  // Allow rendering immediately by passing a starting value as startWith.
  // We remove this from the params passed to io.
  let startingValue
  const haveStartingValue =
    params && Object.prototype.hasOwnProperty.call(params, 'startWith')

  if (haveStartingValue) {
    const {startWith, ...other} = params
    startingValue = startWith
    params = other
  }

  let [state, setState] = useState(WAITING)

  if (state === WAITING) {
    const firstValue$ = io(path, params).pipe(take(1))

    let syncError

    firstValue$
      .subscribe({
        next: (value) => {
          state = value
        },
        error: (error) => {
          syncError = error
        },
      })
      .unsubscribe()

    if (syncError) {
      throw syncError
    }

    // We don't have a sync value.
    if (state === WAITING) {
      if (haveStartingValue) {
        state = startingValue
      } else {
        return suspend(firstValue$.toPromise().catch(setError))
      }
    }
  }

  useEffect(() => {
    // Reset state, noop if identical.
    setState(WAITING)

    const subscription = io(path, params).subscribe({
      next: setState,
      error: setError,
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [path, params && JSON.stringify(params)])

  return state
}
