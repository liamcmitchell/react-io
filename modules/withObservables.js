import {Component, createFactory} from 'react'
import {combineLatest} from 'rxjs/observable/combineLatest'
import {map} from 'rxjs/operators/map'
import values from 'lodash/values'
import keys from 'lodash/keys'
import zipObject from 'lodash/zipObject'

// Like recompose/withProps but resolves observables.
const withObservables = (observables, {startWith, error} = {}) => BaseComponent => {
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

      const observablesMap = typeof observables === 'function' ?
        observables(props) :
        observables

      // If startWith is provided, render first.
      // This will be overwritten if observables resolve before next render.
      if (startWithFactory) {
        this.setState({vdom: startWithFactory(props)})
      }

      this.subscription = combineLatest(values(observablesMap))
        .pipe(map(latestValues => ({
          ...props,
          // Rebuild observablesMap with latest values.
          ...zipObject(keys(observablesMap), latestValues)
        })))
        .subscribe({
          next: this.handleNext,
          error: this.handleError
        })

      // Important that unsubscribe happens after subscribe.
      // This allows caching of observables.
      if (prevSubscription) {
        prevSubscription.unsubscribe()
      }
    }

    handleNext(props) {
      this.setState({vdom: baseFactory(props)})
    }

    handleError(error) {
      if (errorFactory) {
        this.setState({vdom: errorFactory({...this.props, error})})
      }
      else {
        console.error(error) // eslint-disable-line
      }
    }

    componentWillReceiveProps(nextProps) {
      this.subscribe(nextProps)
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

export default withObservables
