import mapValues from 'lodash/mapValues'
import {compose, fromRenderProps} from 'recompose'
import {withObservables} from './withObservables'
import {Consumer} from './context'
import {isFunction, isObservable} from './util'

const getIO = fromRenderProps(Consumer, (io) => ({io}))

// HOC to provide component with io.
// Optionally specify io requests to add to prop stream.
// withIO([requests])(Component)
export const withIO = (requests, config) => {
  if (!requests) return getIO

  return compose(
    getIO,
    withObservables((props) => {
      const {io} = props

      // Turn requests into observables if they aren't already.
      return mapValues(
        isFunction(requests) ? requests(props) : requests,
        (request) => (isObservable(request) ? request : io(request))
      )
    }, Object.assign({isStatic: !isFunction(requests)}, config))
  )
}
