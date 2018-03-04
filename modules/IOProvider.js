import withContext from 'recompose/withContext'
import {context} from './context'

export const IOProvider = withContext(context, ({io}) => ({io}))(
  ({children}) => children
)
