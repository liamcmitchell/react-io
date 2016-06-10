import React, {Component, PropTypes} from 'react'
import hoistStatics from 'hoist-non-react-statics'
import isPlainObject from 'lodash/isPlainObject'
import isFunction from 'lodash/isFunction'

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

// Provide component with io from context.
// Optionally specify static io urls to add to props.
// withIO([urls], WrappedComponent, [renderWaiting], [renderError])
// TODO: Is there a reason to prefer an API like redux connect?
export default function withIO(urls, WrappedComponent, renderWaiting, renderError) {
  if (!WrappedComponent) {
    WrappedComponent = urls
    urls = null
  }

  if (!WrappedComponent || !isFunction(WrappedComponent)) {
    throw new Error('withIO requires a component to wrap')
  }

  if (urls && !isPlainObject(urls)) {
    throw new Error('urls must be a plain object mapping prop:url')
  }

  class WithIO extends Component {
    static displayName = `withIO(${getDisplayName(WrappedComponent)})`

    static contextTypes = {
      io: PropTypes.func.isRequired
    }

    static WrappedComponent = WrappedComponent

    static ioUrls = urls

    render() {
      const {io} = this.context
      return urls ? io(urls).render(data =>
        <WrappedComponent
          io={io}
          {...data}
          {...this.props}
        />
      , renderWaiting, renderError) : (
        <WrappedComponent
          io={io}
          {...this.props}
        />
      )
    }
  }

  return hoistStatics(WithIO, WrappedComponent)
}
