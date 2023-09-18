import React, {Component} from 'react'
import {Context} from './context'
import {isFunction, isObservable} from './util'

// HOC to provide component with io.
// Optionally specify io requests to add to prop stream.
// Like recompose/withProps but resolves observables.
// withIO([requests, config])(Component)
export const withIO = (
  requests = {},
  {startWith: StartComponent, error: ErrorComponent} = {}
) => {
  const isStatic = !isFunction(requests)

  return (BaseComponent) => {
    class WithObservables extends Component {
      static contextType = Context

      state = {
        results: null,
        error: null,
      }

      UNSAFE_componentWillMount() {
        this.subscribe(this.props)
      }

      subscribe(props) {
        // istanbul ignore next
        if (this.state.error) return

        const io = this.context

        const requestEntries = Object.entries(
          isStatic ? requests : requests({...props, io})
        )

        // Reset results state.
        // If we have no requests, we must resolve empty object.
        // Otherwise we wait until all requests are resolved.
        this.setState({
          results: requestEntries.length === 0 ? {} : null,
        })

        const prevRequests = this.requests || {}
        this.requests = Object.fromEntries(requestEntries)
        const prevSubscriptions = this.subscriptions || {}
        this.subscriptions = {}
        const prevResults = this.results || {}
        this.results = {}

        for (const [prop, request] of requestEntries) {
          // Reuse previous subscription and result if possible.
          if (prevRequests[prop] === request && prevSubscriptions[prop]) {
            this.subscriptions[prop] = prevSubscriptions[prop]
            if (Object.prototype.hasOwnProperty.call(prevResults, prop)) {
              this.results[prop] = prevResults[prop]
            }
            delete prevSubscriptions[prop]
          } else {
            const observable = isObservable(request) ? request : io(request)

            this.subscriptions[prop] = observable.subscribe({
              next: (value) => {
                this.results[prop] = value

                if (
                  Object.values(this.results).length ===
                  Object.values(this.requests).length
                ) {
                  this.setState({
                    results: this.results,
                  })
                }
              },
              error: this.handleError,
            })
          }
        }

        // Important that unsubscribe happens after subscribe.
        // This allows caching of observables.
        this.unsubscribe(prevSubscriptions)
      }

      handleError = (error) => {
        // Only deal with the first error.
        if (this.state.error) return

        if (ErrorComponent) {
          this.setState({
            error,
          })
        } else {
          this.setState(null, () => {
            throw error
          })
        }

        this.unsubscribe(this.subscriptions)
      }

      unsubscribe(subscriptions) {
        for (const prop in subscriptions) {
          subscriptions[prop].unsubscribe()
          delete subscriptions[prop]
        }
      }

      UNSAFE_componentWillReceiveProps(nextProps) {
        if (!isStatic) {
          this.subscribe(nextProps)
        }
      }

      componentWillUnmount() {
        this.unsubscribe(this.subscriptions)
      }

      shouldComponentUpdate(nextProps, nextState) {
        // Only update if we have a start component or results.
        // This forces child components to wait until dynamic requests are done.
        return Boolean(StartComponent || nextState.results)
      }

      render() {
        const {results, error} = this.state
        const io = this.context

        if (error && ErrorComponent) {
          return <ErrorComponent {...this.props} io={io} error={error} />
        }

        if (results) {
          return <BaseComponent {...this.props} {...results} io={io} />
        }

        if (!results && StartComponent) {
          return <StartComponent {...this.props} io={io} />
        }

        return null
      }
    }

    // istanbul ignore else
    if (process.env.NODE_ENV !== 'production') {
      const baseName =
        BaseComponent.displayName || BaseComponent.name || 'Component'
      WithObservables.displayName = `withIO(${baseName})`
    }

    return WithObservables
  }
}
