import React from 'react'
import PropTypes from 'prop-types'

export const Context = React.createContext()
export const Consumer = Context.Consumer
export const Provider = Context.Provider

export function IOProvider({io, children}) {
  return <Provider value={io}>{children}</Provider>
}

if (process.env.NODE_ENV !== 'production') {
  IOProvider.propTypes = {
    io: PropTypes.func.isRequired,
    children: PropTypes.node,
  }
}
