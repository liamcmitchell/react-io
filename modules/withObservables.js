import {Component} from 'react'
import createEagerFactory from 'recompose/createEagerFactory'
import {combineLatest} from 'rxjs/observable/combineLatest'
import {map} from 'rxjs/operator/map'
import values from 'lodash/values'
import keys from 'lodash/keys'
import zipObject from 'lodash/zipObject'
import createHelper from 'recompose/createHelper'

// Like recompose/withProps but resolves observables.
const withObservables = observables => BaseComponent => {
  const factory = createEagerFactory(BaseComponent)

  return class WithObservables extends Component {
    state = {vdom: null}

    componentWillMount() {
      this.subscribe(this.props)
    }

    subscribe(props) {
      const prevSubscription = this.subscription

      const observablesMap = typeof observables === 'function' ?
        observables(props) :
        observables

      this.subscription = combineLatest(values(observablesMap))
        ::map(latestValues => ({
          ...props,
          // Rebuild observablesMap with latest values.
          ...zipObject(keys(observablesMap), latestValues)
        }))
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

    handleNext = props => this.setState({vdom: factory(props)})

    handleError = err => console.error(err) // eslint-disable-line

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

export default createHelper(withObservables, 'withObservables')
