import React from 'react'
import {mapProps} from 'recompose'

export const Context = React.createContext()
export const Consumer = Context.Consumer
export const Provider = Context.Provider

export const IOProvider = mapProps(({io, children}) => ({value: io, children}))(
  Provider
)
