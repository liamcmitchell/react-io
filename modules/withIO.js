import React, {Component, PropTypes} from 'react'
import hoistStatics from 'hoist-non-react-statics'
import isPlainObject from 'lodash/isPlainObject'
import isFunction from 'lodash/isFunction'
import values from 'lodash/values'
import keys from 'lodash/keys'
import zipObject from 'lodash/zipObject'
import render from './render'
import {combineLatest} from 'rxjs/observable/combineLatest'

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

      if (urls) {
        return combineLatest(values(urls).map(url => io(url)))
          ::render(values =>
            <WrappedComponent
              io={io}
              {...zipObject(keys(urls), values)}
              {...this.props}
            />,
            renderWaiting,
            renderError
          )
      }
      else {
        return <WrappedComponent io={io} {...this.props} />
      }
    }
  }

  return hoistStatics(WithIO, WrappedComponent)
}
