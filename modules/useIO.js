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
    } else if (state === WAITING) {
      // If we don't have a sync value, suspend until we do.
      suspend(firstValue$.toPromise())
    }
  }

  useEffect(() => {
    // Reset state, noop if already WAITING.
    setState(WAITING)

    const subscription = io(path, params).subscribe({
      next: setState,
      error: (error) => {
        // Throwing inside setState allows error to be caught by error boundaries.
        setState(() => {
          throw error
        })
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [path, params && JSON.stringify(params)])

  return state
}
