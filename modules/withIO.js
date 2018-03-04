import mapValues from 'lodash/mapValues'
import getContext from 'recompose/getContext'
import compose from 'recompose/compose'
import {withObservables} from './withObservables'
import {context} from './context'

// HOC to provide component with io.
// Optionally specify static io urls to add to prop stream.
// withIO([urls])(Component)
export const withIO = (urls, config) => {
  if (!urls) {
    return getContext(context)
  }

  return compose(
    getContext(context),
    withObservables((props) => {
      const {io} = props

      const urlsMap = typeof urls === 'function' ? urls(props) : urls

      // Turn urls into observables if they aren't already.
      return mapValues(
        urlsMap,
        (url) => (typeof url.subscribe === 'function' ? url : io(url))
      )
    }, config)
  )
}
