# react-io

React bindings for [url-io](https://github.com/liamcmitchell/url-io)
Request and mutate data using a standard interface passed through React context.

> [!NOTE]
> As far as I know, this is only used at [Sharecare](https://www.sharecare.com/).
> [SWR](https://swr.vercel.app/) is a better alternative.

## Passing IO through context

### <IOProvider />

Adds IO to context. Use once at the root of your app.

```javascript
import React from 'react'
import {IOProvider} from 'react-io'
import io from './io'

export default function App() {
  return <IOProvider io={io}>...</IOProvider>
}
```

## Consuming io

### useIO([path, params])

When called without any args, it returns the `io` function that can be used in callbacks.

```javascript
import {useIO} from 'react-io'

export default function Widget() {
  const io = useIO()

  return <button onClick={() => io('/path', 'SAVE', {value: 'x'})}>Save</button>
}
```

When called with path and params, it will subscribe to and return values from io. By default, it [suspends](https://reactjs.org/docs/concurrent-mode-suspense.html) until the observable resolves. **Note that suspense does not officially support this use case.** Errors will be thrown to React and should be caught using [error boundaries](https://reactjs.org/docs/error-boundaries.html).

```javascript
import {useIO} from 'react-io'

export default function Widget() {
  const auth = useIO('/auth')

  return auth ? <div>{auth.username}</div> : <div>Not authorized</div>
}
```

Add `startWith` to params to provide a starting value and avoid suspense. This param is omitted from other params passed to io.

```javascript
import {useIO} from 'react-io'

export default function Widget() {
  const auth = useIO('/auth', {startWith: undefined})

  return auth === undefined ? (
    <div>...loading...</div>
  ) : auth ? (
    <div>{auth.username}</div>
  ) : (
    <div>Not authorized</div>
  )
}
```

Add `returnStateWrapper: true` to params to return a state wrapper containing `{loading, value, error}`, avoiding suspense and throwing errors. This param is omitted from other params passed to io.

```javascript
import {useIO} from 'react-io'

export default function Widget() {
  const auth = useIO('/auth', {returnStateWrapper: true})

  return auth.loading ? (
    <div>...loading...</div>
  ) : auth.error ? (
    <div>Error: {error.toString()}</div>
  ) : auth.value ? (
    <div>{auth.value.username}</div>
  ) : (
    <div>Not authorized</div>
  )
}
```

Hooks require that observables are subscribed to optimistically and cached outside of React state. This means there may be cached subscriptions in an orphaned or errored state. `pruneCache()` is available to clean all unused cache entries when needed.

### useIOResources(requests)

Subscribes to multiple resources in parallel.
Returns a `{loading, value, error}` object for each request.
Request can be a path string or `[path, params]` array.

```javascript
import {useIOResources} from 'react-io'

export default function Widget() {
  const {auth, withParams} = useIOResources({
    auth: '/auth',
    withParams: ['/auth', {other: 1}],
  })

  return auth.loading ? (
    <div>...loading...</div>
  ) : auth.error ? (
    <div>Error: {error.toString()}</div>
  ) : auth.value ? (
    <div>{auth.value.username}</div>
  ) : (
    <div>Not authorized</div>
  )
}
```

### withIO([urls])(WrappedComponent)

Returns a higher-order-component (HOC) that pulls io from context and passes it to the wrapped component as a prop.

Pass it a map of urls or a mapper to turn props into a map of urls and it will add the resolved values to the prop stream.

```javascript
import {withIO} from 'react-io'

export default withIO({
  auth: '/auth',
})(function Widget({io, auth}) {
  return auth ? <div>{auth.username}</div> : <div>Not authorized</div>
})
```
