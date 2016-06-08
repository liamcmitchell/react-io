import {PropTypes} from 'react'
import contextProviderComponent from 'src/contextProviderComponent'
import withContextFunction from 'src/withContextFunction'

const types = {
  io: PropTypes.func.isRequired
}

export const IOProvider = contextProviderComponent(types, 'IOProvider')

export const withIO = withContextFunction(types, 'withIO')
