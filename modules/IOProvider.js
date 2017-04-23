import withContext from 'recompose/withContext'
import contextTypes from './contextTypes'

export default withContext(
  contextTypes,
  ({io}) => ({io})
)(({children}) => children)
