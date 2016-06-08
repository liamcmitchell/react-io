import React, {Component, PropTypes} from 'react'

export default class Observable extends Component {
  static propTypes = {
    observable: PropTypes.shape({
      subscribe: PropTypes.func.isRequired
    }).isRequired,
    render: PropTypes.func,
    renderWaiting: PropTypes.func,
    renderError: PropTypes.func
  }

  static defaultProps = {
    render: v => v,
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
    // Avoid resubscribing if we have the same observable.
    if (this.subscribedObservable === observable) {
      return
    }
    this.subscribedObservable = observable

    // Save existing subscription so we can unsubscribe at end.
    const oldSubscription = this.subscription

    // Set waiting state.
    this.setState({vdom: this.props.renderWaiting.call()})

    this.subscription = observable.subscribe(value => {
      this.setState({vdom: this.props.render.call(null, value)})
    }, error => {
      this.setState({vdom: this.props.renderError.call(null, error, this.retry.bind(this))})
    })

    // Remove previous subscription.
    oldSubscription && oldSubscription.dispose()
  }

  retry() {
    this.subscription.dispose()
    delete this.subscribedObservable
    this.subscribe(this.props.observable)
  }

  componentWillUnmount() {
    this.subscription.dispose()
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
