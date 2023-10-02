import {useEffect, useRef, useState, useContext} from 'react'
import {Context} from './context'
import {unsubscribe} from './util'

const requestString = (request) =>
  typeof request === 'string' ? request : JSON.stringify(request)

const requestArgs = (request) => {
  const args = Array.isArray(request) ? request : [request]

  // istanbul ignore next
  if (
    process.env.NODE_ENV !== 'production' &&
    args[1] &&
    typeof args[1] !== 'object'
  ) {
    throw new Error(
      'Params must be an object. Are you trying to use a non-OBSERVE method? useIOResources only supports OBSERVE requests: [path, params]'
    )
  }

  return args
}

export const useIOResources = (requests) => {
  const io = useContext(Context)
  const ref = useRef({
    requests: {},
    subscriptions: {},
    results: {},
  })
  const [, queueUpdate] = useState()

  useEffect(() => {
    const prevRequests = ref.current.requests
    ref.current.requests = requests
    const prevSubscriptions = ref.current.subscriptions
    ref.current.subscriptions = {}
    const prevResults = ref.current.results
    ref.current.results = {}

    for (const [prop, request] of Object.entries(requests)) {
      // Reuse previous subscriptions if requests are equal.
      if (
        prevSubscriptions[prop] &&
        requestString(prevRequests[prop]) === requestString(request)
      ) {
        ref.current.subscriptions[prop] = prevSubscriptions[prop]
        ref.current.results[prop] = prevResults[prop]
        delete prevSubscriptions[prop]
      } else {
        ref.current.subscriptions[prop] = io(...requestArgs(request)).subscribe(
          {
            next: (value) => {
              if (
                !ref.current.results[prop] ||
                ref.current.results[prop].value !== value
              ) {
                ref.current.results[prop] = {
                  loading: false,
                  value,
                  error: undefined,
                }
                queueUpdate({})
              }
            },
            error: (error) => {
              ref.current.results[prop] = {
                loading: false,
                // Preserve value before error, if it exists.
                value: ref.current.results[prop]?.value,
                error,
              }
              queueUpdate({})
            },
          }
        )
      }
    }

    unsubscribe(prevSubscriptions)
  })

  useEffect(
    () => () => {
      // Unmount
      unsubscribe(ref.current.subscriptions)
    },
    []
  )

  return Object.fromEntries(
    Object.keys(requests).map((key) => [
      key,
      ref.current.results[key] || {
        loading: true,
        value: undefined,
        error: undefined,
      },
    ])
  )
}
