# react-io
React bindings for [url-io](https://github.com/liamcmitchell/url-io)
Request and mutate data using a standard interface passed through React context.

### ::render(renderValue, [renderWaiting], [renderError])
Call on an observable to return a React element that will render value, waiting and error using the given functions.

```javascript
renderValue(value) // required
renderWaiting() // default: renders null
renderError(error, retry) // default: renders error in red box with retry button
```

```javascript
import React from 'react'
import {combineLatest} from 'rxjs/observable/combineLatest'
import {render} from 'react-io'
import io from './io'

function Widget() {
  return <div>
    {io('/user')::render(user => <div>{user + '!'}</div>)}

    {combineLatest(
      io('/user'),
      io('/auth')
    )::render(([user, auth]) =>
      <div>{user + auth + '!'}</div>
    )}
  </div>
}
```

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

## withIO([urls], WrappedComponent, [renderWaiting], [renderError])
Returns a higher-order-component (HOC) that pulls io from context and passes it to the wrapped component as a prop.

```javascript
import {withIO, render} from 'react-io'

export default withIO(function User({io, id}) {
  return <div>
    <h1>User</h1>
    {io(`/user/${id}`)::render(user => <div>{user}</div>)}
  </div>
})
```

It can also be passed an object of urls to read and pass as props.

Internally this uses the render method described above so you can pass renderWaiting and renderError to override the default behavior.

This allows for a cleaner sytax but only works with static urls (that don't depend on props or state).

```javascript
import {withIO, render} from 'react-io'

export default withIO({
  auth: '/auth'
}, function Widget({io, auth}) {
  return auth ?
    io(`/user/${id}`)::render(user => <div>{user}</div>) :
    <div>Not authorized</div>
}/* , renderWaiting, renderError */)
```
