import {withContext} from 'recompose'
import {context} from './context'

export const IOProvider = withContext(context, ({io}) => ({io}))(
  ({children}) => children
)
