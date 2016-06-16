# react-io
Declaritive data API
Request and mutate data using a standard interface passed through React context.

## io(url)
The standard interface to read and mutate data.
Returns an object that represents data at a given URL.
It can be consumed as both an [Observable](https://github.com/zenparsing/es-observable) (with .subscribe) and a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) (with .next).

A URL is a string starting with a forward slash e.g. '/user'
It is possible to read and mutate data at multiple URLs in the same request.
```javascript
io('/user').next(auth => {})
io(['/user', '/auth']).next(([user, auth]) => {})
io({user: '/user', auth: '/auth'}).next(({user, auth}) => {})
```

### io(url).render(renderValue, [renderWaiting], [renderError])
Returns a React element that will render value, waiting and error using the given functions.

renderValue(value) required
renderWaiting() default: renders null
renderError(error, retry) default: renders error in red box with retry button

```javascript
io('/user').render(user => <div>{user + '!'}</div>)
```

```javascript
io({user: '/user', auth: '/auth'}).render(
  ({user, auth}) => <div>{user + auth + '!'}</div>,
  () => <div>Loading...</div>,
  (error, retry) => <div onClick={retry}>Error, click to retry.</div>
)
```

## withIO([urls], WrappedComponent, [renderWaiting], [renderError])
Returns a higher-order-component (HOC) that pulls io from context and passes it to the wrapped component as a prop.

```javascript
import {withIO} from 'react-io'

export default withIO(function User({io, id}) {
  return <div>
    <h1>User</h1>
    {io(`/user/${id}`).render(user => <div>{user}</div>)}
  </div>
})
```

It can also be passed an object of urls to read and pass as props.
Internally this uses the render method described above so you can pass renderWaiting and renderError to override the default behavior.
This allows for a cleaner sytax but only works with static urls (that don't depend on props or state).

```javascript
import {withIO} from 'react-io'

export default withIO({
  auth: '/auth'
}, function Widget({auth, io}) {
  return auth ?
    io(`/user/${id}`).render(user => <div>{user}</div>) :
    <div>Not authorized</div>
}/* , renderWaiting, renderError */)
```
