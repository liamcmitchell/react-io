import React from 'react'
import PropTypes from 'prop-types'

export const Context = React.createContext(
  // istanbul ignore next
  () => {
    throw new Error('io not defined')
  }
)
export const Consumer = Context.Consumer
export const Provider = Context.Provider

export function IOProvider({io, children}) {
  return <Provider value={io}>{children}</Provider>
}

// istanbul ignore else
if (process.env.NODE_ENV !== 'production') {
  IOProvider.propTypes = {
    io: PropTypes.func.isRequired,
    children: PropTypes.node,
  }
}
