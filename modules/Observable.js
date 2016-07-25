import React, {Component, PropTypes} from 'react'

export default class Observable extends Component {
  static propTypes = {
    observable: PropTypes.shape({
      subscribe: PropTypes.func.isRequired
    }).isRequired,
    renderValue: PropTypes.func,
    renderWaiting: PropTypes.func,
    renderError: PropTypes.func
  }

  static defaultProps = {
    renderValue: v => v,
    renderWaiting: () => null,
    renderError: defaultRenderError
  }

  constructor(props, context) {
    super(props, context)
    this.state = {vdom: null}
  }

  componentWillMount() {
    this.subscribe(this.props.observable)
  }

  componentWillReceiveProps(nextProps) {
    this.subscribe(nextProps.observable)
  }

  subscribe(observable) {
    const {renderValue, renderWaiting, renderError} = this.props
    const {subscribedObservable, subscription} = this

    // Avoid resubscribing if we have the same observable.
    if (subscribedObservable === observable) {
      return
    }
    this.subscribedObservable = observable

    // Set waiting state.
    this.setState({vdom: renderWaiting()})

    this.subscription = observable.subscribe(value => {
      this.setState({vdom: renderValue(value)})
    }, error => {
      this.setState({vdom: renderError(error, this.retry.bind(this))})
    })

    // Remove previous subscription.
    if (subscription) {
      subscription.unsubscribe()
    }
  }

  retry() {
    this.subscription.unsubscribe()
    delete this.subscribedObservable
    this.subscribe(this.props.observable)
  }

  componentWillUnmount() {
    this.subscription.unsubscribe()
  }

  render() {
    return this.state.vdom
  }
}

export function defaultRenderError(error, retry) {
  console.error(error) // eslint-disable-line
  return (
    <div style={{
      backgroundColor: 'red',
      font: '12px monospace',
      color: 'white',
      padding: 8
    }}>
      {error.toString()}
      <div onClick={retry} style={{
        paddingTop: 8,
        fontWeight: 'bold',
        cursor: 'pointer'
      }}>
        Retry
      </div>
    </div>
  )
}
