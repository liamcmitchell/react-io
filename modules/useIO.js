import {useEffect, useState, useContext} from 'react'
import {Context} from './context'

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

  const [state, setState] = useState(undefined)

  useEffect(() => {
    // If we have a value from a previous subscription, reset.
    if (state !== undefined) {
      setState(undefined)
    }

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
