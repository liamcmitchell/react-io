import {PropTypes} from 'react'
import mapValues from 'lodash/mapValues'
import getContext from 'recompose/getContext'
import createHelper from 'recompose/createHelper'
import compose from 'recompose/compose'
import withObservables from './withObservables'

const ioContextTypes = {io: PropTypes.func.isRequired}

// HOC to provide component with io.
// Optionally specify static io urls to add to prop stream.
// withIO([urls])(Component)
const withIO = (urls) => {
  if (!urls) {
    return getContext(ioContextTypes)
  }

  return compose(
    getContext(ioContextTypes),
    withObservables(props => {
      const {io} = props

      const urlsMap = typeof urls === 'function' ?
        urls(props) :
        urls

      // Turn urls into observables if they aren't already.
      return mapValues(urlsMap, url =>
        typeof url.subscribe === 'function' ?
          url :
          io(url)
      )
    })
  )
}

export default createHelper(withIO, 'withIO')
