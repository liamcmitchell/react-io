import {PropTypes} from 'react'
import withContext from 'recompose/withContext'

export default withContext(
  {io: PropTypes.func.isRequired},
  ({io}) => ({io})
)(({children}) => children)
