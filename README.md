# react-io
React bindings for [url-io](https://github.com/liamcmitchell/url-io)
Request and mutate data using a standard interface passed through React context.

## Passing IO through context

## <IOProvider />
Adds IO to context. Use once at the root of your app.

```javascript
import React from 'react'
import {IOProvider} from 'react-io'
import io from './io'

export default function App() {
  return <IOProvider io={io}>
    ...
  </IOProvider>
}
```

## withIO([urls])(WrappedComponent)
Returns a higher-order-component (HOC) that pulls io from context and passes it to the wrapped component as a prop.

Pass it a map of urls or a mapper to turn props into a map of urls and it will add the resolved values to the prop stream.

```javascript
import {withIO, render} from 'react-io'

export default withIO({
  auth: '/auth'
})(function Widget({io, auth}) {
  return auth ?
    <div>{auth.username}</div>) :
    <div>Not authorized</div>
})
```
