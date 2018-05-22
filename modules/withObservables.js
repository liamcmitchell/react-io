import {Component, createFactory} from 'react'
import {combineLatest} from 'rxjs/observable/combineLatest'
import zipObject from 'lodash/zipObject'
import {isFunction} from './util'

// Like recompose/withProps but resolves observables.
export const withObservables = (
  observables,
  {startWith, error, isStatic} = {}
) => (BaseComponent) => {
  isStatic = isStatic || !isFunction(observables)

  const baseFactory = createFactory(BaseComponent)
  const startWithFactory = startWith && createFactory(startWith)
  const errorFactory = error && createFactory(error)

  return class WithObservables extends Component {
    constructor() {
      super()
      this.state = {vdom: null}
      this.handleNext = this.handleNext.bind(this)
      this.handleError = this.handleError.bind(this)
    }

    componentWillMount() {
      this.subscribe(this.props)
    }

    subscribe(props) {
      const prevSubscription = this.subscription

      // Becasue this will be called from componentWillReceiveProps
      // we need to keep a ref to the props we are working with.
      this._props = props

      this._observables = isFunction(observables)
        ? observables(props)
        : observables

      // If startWith is provided, render first.
      // This will be overwritten if observables resolve before next render.
      if (startWithFactory) {
        this._results = undefined
        this.setState({vdom: startWithFactory(props)})
      }

      this.subscription = combineLatest(
        Object.values(this._observables)
      ).subscribe({
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
      this._results = zipObject(Object.keys(this._observables), values)
      this.update()
    }

    update() {
      if (!this._results) return

      const childProps = Object.assign({}, this._props, this._results)

      this.setState({
        vdom: baseFactory(childProps),
      })
    }

    handleError(error) {
      if (errorFactory) {
        this.setState({
          vdom: errorFactory(Object.assign({}, this.props, {error})),
        })
      } else {
        this.setState(null, () => {
          throw error
        })
      }
    }

    componentWillReceiveProps(nextProps) {
      if (isStatic) {
        this._props = nextProps
        this.update()
      } else {
        this.subscribe(nextProps)
      }
    }

    shouldComponentUpdate(nextProps, nextState) {
      return nextState.vdom !== this.state.vdom
    }

    componentWillUnmount() {
      this.subscription.unsubscribe()
    }

    render() {
      return this.state.vdom
    }
  }
}
