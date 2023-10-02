import React, {Component, memo} from 'react'
import {Context} from './context'
import {isObservable, unsubscribe} from './util'

// HOC to provide component with io.
// Optionally specify io requests to add to prop stream.
// Like recompose/withProps but resolves observables.
// withIO([requests, config])(Component)
export const withIO = (
  requests = {},
  {startWith: StartComponent, error: ErrorComponent} = {}
) => {
  return (BaseComponent) => {
    BaseComponent = memo(BaseComponent)

    class WithObservables extends Component {
      static contextType = Context

      state = {
        renderProps: null,
        error: null,
      }

      componentDidMount() {
        this.subscribe()
      }

      subscribe() {
        // istanbul ignore next
        if (this.state.error) return

        const io = this.context

        const prevRequests = this.requests || {}
        this.requests =
          typeof requests === 'function'
            ? requests({...this.props, io})
            : requests
        const prevSubscriptions = this.subscriptions || {}
        this.subscriptions = {}
        const prevResults = this.results || {}
        this.results = {}

        for (const [prop, request] of Object.entries(this.requests)) {
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
                this.queueUpdate()
              },
              error: this.handleError,
            })
          }
        }

        // Important that unsubscribe happens after subscribe.
        // This allows caching of observables.
        unsubscribe(prevSubscriptions)

        this.queueUpdate()
      }

      queueUpdate() {
        const hasResults =
          Object.values(this.results).length ===
          Object.values(this.requests).length

        if (hasResults) {
          this.setState({
            renderProps: {
              ...this.props,
              ...this.results,
            },
          })
        } else if (StartComponent && this.state.renderProps) {
          // If we have an explicit start component, we reset back to null
          // so it can be rendered.
          // If not, the prev renderProps will be kept until we have results.
          this.setState({
            renderProps: null,
          })
        }
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

        unsubscribe(this.subscriptions)
      }

      componentDidUpdate(prevProps) {
        // Only re-subscribe on prop change.
        if (this.props !== prevProps) {
          this.subscribe()
        }
      }

      componentWillUnmount() {
        unsubscribe(this.subscriptions)
      }

      render() {
        const {renderProps, error} = this.state
        const io = this.context

        if (error && ErrorComponent) {
          return <ErrorComponent {...this.props} io={io} error={error} />
        }

        if (renderProps) {
          return <BaseComponent {...renderProps} io={io} />
        }

        if (!renderProps && StartComponent) {
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
