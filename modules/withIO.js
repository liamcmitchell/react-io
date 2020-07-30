import React, {Component} from 'react'
import mapValues from 'lodash/mapValues'
import zipObject from 'lodash/zipObject'
import {Context} from './context'
import {isFunction, isObservable} from './util'
import {combineLatest, of} from 'rxjs'

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
        vdom: null,
        results: null,
        error: null,
      }

      handleNext = this.handleNext.bind(this)
      handleError = this.handleError.bind(this)
      requestToObservable = this.requestToObservable.bind(this)

      requestToObservable(request) {
        const io = this.context
        return isObservable(request) ? request : io(request)
      }

      UNSAFE_componentWillMount() {
        this.subscribe(this.props)
      }

      subscribe(props) {
        const prevSubscription = this.subscription
        const io = this.context

        // Becasue this will be called from componentWillReceiveProps
        // we need to keep a ref to the props we are working with.
        this._props = props

        this._observables = mapValues(
          isFunction(requests) ? requests({...props, io}) : requests,
          this.requestToObservable
        )

        // If startWith is provided, reset results.
        // This will be overwritten if observables resolve before next render.
        if (StartComponent) {
          this.setState({
            results: null,
          })
        }

        // If given an empty list, combineLatest will never resolve.
        // Emitting an empty object is more useful.
        const observableValues = Object.values(this._observables)
        const combinedObservable =
          observableValues.length === 0
            ? of({})
            : combineLatest(observableValues)

        this.subscription = combinedObservable.subscribe({
          next: this.handleNext,
          error: this.handleError,
        })

        // Important that unsubscribe happens after subscribe.
        // This allows caching of observables.
        if (prevSubscription) {
          prevSubscription.unsubscribe()
        }
      }

      handleNext(values) {
        this.setState({
          results: zipObject(Object.keys(this._observables), values),
        })
      }

      handleError(error) {
        if (ErrorComponent) {
          this.setState({
            error,
          })
        } else {
          this.setState(null, () => {
            throw error
          })
        }
      }

      UNSAFE_componentWillReceiveProps(nextProps) {
        if (!isStatic) {
          this.subscribe(nextProps)
        }
      }

      componentWillUnmount() {
        this.subscription.unsubscribe()
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
      WithObservables.displayName = `withIO(${
        BaseComponent.displayName || BaseComponent.name || 'Component'
      })`
    }

    return WithObservables
  }
}
