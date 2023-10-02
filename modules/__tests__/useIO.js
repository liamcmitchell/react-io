/* eslint-disable react/prop-types */
import React, {Suspense} from 'react'
import {render} from '@testing-library/react'
import {pruneCache, useIO} from '../useIO'
import {IOProvider} from '../context'
import {of, BehaviorSubject, Subject, Observable} from 'rxjs'
import {createIO} from 'url-io'
import {suspend} from '../suspense'
import {act} from 'react-dom/test-utils'

jest.mock('../suspense')

beforeEach(() => {
  suspend.mockClear()
  suspend.mockImplementation((promise) => {
    throw promise
  })
})

describe('useIO', () => {
  it('returns io with no args', () => {
    const io = () => 'io!'

    const Component = () => {
      const io = useIO()

      return <div>{io()}</div>
    }

    render(<Component />, {
      wrapper: (props) => <IOProvider {...props} io={io} />,
    })

    expect(document.body.textContent).toBe('io!')
  })

  it('returns path result', () => {
    const io = (request) => of(request)

    const Component = () => {
      const result = useIO('/path')

      return <div>{result}</div>
    }

    render(<Component />, {
      wrapper: (props) => <IOProvider {...props} io={io} />,
    })

    expect(document.body.textContent).toBe('/path')
  })

  it('returns path & params result', () => {
    const io = createIO((request) => request)

    const Component = () => {
      const result = useIO('/path', {a: 1})

      return <div>{JSON.stringify(result)}</div>
    }

    render(<Component />, {
      wrapper: (props) => <IOProvider {...props} io={io} />,
    })

    expect(document.body.textContent).toMatch('"originalPath":"/path"')
    expect(document.body.textContent).toMatch('"params":{"a":1}')
  })

  it('avoids resubscribing for the same request', () => {
    let subscriptions = 0
    const io = createIO(({params: {a}}) => {
      ++subscriptions
      return a
    })

    let renders = 0
    const Component = () => {
      renders++
      const result = useIO('/path', {a: 1})

      return <div>{result}</div>
    }

    const {rerender} = render(<Component />, {
      wrapper: (props) => <IOProvider {...props} io={io} />,
    })

    expect(document.body.textContent).toBe('1')

    rerender(<Component />)

    expect(renders).toBeGreaterThanOrEqual(2)
    expect(subscriptions).toBe(1)
    expect(document.body.textContent).toBe('1')
  })

  it('subscribes to new observable for new request', () => {
    let subscriptions = 0
    const io = createIO(({params: {a}}) => {
      ++subscriptions
      return a
    })

    let renders = 0
    const Component = ({a}) => {
      renders++
      const result = useIO('/path', {a})

      return <div>{result}</div>
    }

    const {rerender} = render(<Component a={1} />, {
      wrapper: (props) => <IOProvider {...props} io={io} />,
    })

    expect(document.body.textContent).toBe('1')

    rerender(<Component a={2} />)

    expect(renders).toBeGreaterThanOrEqual(2)
    expect(subscriptions).toBe(2)
    expect(document.body.textContent).toBe('2')
  })

  it('renders immediately if passed a starting value as startWith', async () => {
    const subject = new Subject()
    const source = jest.fn(() => subject)
    const io = createIO(source)

    const Component = () => {
      const result = useIO('/path', {startWith: 'start'})

      return <div>{JSON.stringify(result)}</div>
    }

    render(<Component />, {
      wrapper: (props) => <IOProvider {...props} io={io} />,
    })

    expect(document.body.textContent).toBe('"start"')
    expect(source).toHaveBeenCalledWith(expect.objectContaining({params: {}}))

    act(() => {
      subject.next('next')
    })

    expect(document.body.textContent).toBe('"next"')
  })

  it('returns state wrapper', async () => {
    const subject = new Subject()
    const source = jest.fn(() => subject)
    const io = createIO(source)

    const Component = () => {
      const result = useIO('/path', {returnStateWrapper: true})

      return JSON.stringify(result)
    }

    render(<Component />, {
      wrapper: (props) => <IOProvider {...props} io={io} />,
    })

    expect(JSON.parse(document.body.textContent)).toEqual({
      loading: true,
      value: undefined,
      error: undefined,
    })

    expect(source).toHaveBeenCalledWith(expect.objectContaining({params: {}}))

    act(() => {
      subject.next('next')
    })

    expect(JSON.parse(document.body.textContent)).toEqual({
      loading: false,
      value: 'next',
      error: undefined,
    })

    const error = new Error('ERR')
    act(() => {
      subject.error(error)
    })

    expect(JSON.parse(document.body.textContent)).toEqual({
      loading: false,
      value: 'next', // will hold last received value
      error: {},
    })
  })

  describe('errors ', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      console.error.mockRestore() // eslint-disable-line
    })

    it('suspends if value does not resolve immediately', async () => {
      const subject = new Subject()
      const io = createIO(() => subject)

      const Component = () => {
        const result = useIO('/path')

        return <div>{JSON.stringify(result)}</div>
      }

      render(
        <Suspense fallback="LOADING">
          <Component />
        </Suspense>,
        {
          wrapper: (props) => <IOProvider {...props} io={io} />,
        }
      )

      expect(document.body.textContent).toBe('LOADING')

      // Test that the promise resolves.
      await act(async () => {
        subject.next(1)
        await Promise.resolve()
      })

      expect(document.body.textContent).toBe('1')
    })

    it('throws sync error from request', () => {
      const io = createIO(() => {
        throw new Error('ERR')
      })

      const Component = () => {
        const result = useIO('/path')

        return <div>{JSON.stringify(result)}</div>
      }

      expect(() => {
        render(<Component />, {
          wrapper: (props) => <IOProvider {...props} io={io} />,
        })
      }).toThrowError('ERR')
    })

    it('throws initial async error that can be caught by react boundary and avoids resubscribing', async () => {
      suspend.mockImplementation(() => {
        return 'SUSPENDED'
      })
      const errorSubject = new Subject()
      let subscriptions = 0

      const io = createIO(() => {
        subscriptions++
        return errorSubject
      })

      const Component = () => {
        const result = useIO('/path')

        return <div>{JSON.stringify(result)}</div>
      }

      class ErrorBoundary extends React.Component {
        state = {error: null}

        static getDerivedStateFromError(error) {
          return {error}
        }

        render() {
          if (this.state.error) {
            return <div>{String(this.state.error)}</div>
          }

          return <Component />
        }
      }

      const {rerender} = render(<ErrorBoundary />, {
        wrapper: (props) => <IOProvider {...props} io={io} />,
      })

      expect(document.body.textContent).toMatch('SUSPENDED')

      errorSubject.error(new Error('ERR'))

      rerender(<ErrorBoundary />)

      expect(document.body.textContent).toMatch('Error')
      expect(subscriptions).toBe(1)
    })

    it('throws subsequent async error that can be caught by react boundary', () => {
      const errorSubject = new BehaviorSubject('x')
      const io = createIO(() => errorSubject)

      const Component = () => {
        const result = useIO('/path')

        return <div>{JSON.stringify(result)}</div>
      }

      class ErrorBoundary extends React.Component {
        state = {hasError: false}

        static getDerivedStateFromError() {
          return {hasError: true}
        }

        render() {
          if (this.state.hasError) {
            return <div>Error</div>
          }

          return this.props.children
        }
      }

      const {rerender} = render(
        <ErrorBoundary>
          <Component />
        </ErrorBoundary>,
        {
          wrapper: (props) => <IOProvider {...props} io={io} />,
        }
      )

      expect(document.body.textContent).toMatch('x')

      act(() => {
        errorSubject.error(new Error('ERR'))
      })

      rerender(
        <ErrorBoundary>
          <Component />
        </ErrorBoundary>
      )

      expect(document.body.textContent).toMatch('Error')
    })
  })
})

describe('pruneCache', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    console.error.mockRestore() // eslint-disable-line
  })

  test('unsubscribes lost cache entries', async () => {
    suspend.mockImplementation(() => {
      return 'SUSPENDED'
    })
    let subscriptions = 0

    const io = () =>
      new Observable(() => {
        subscriptions++
        return () => {
          subscriptions--
        }
      })

    const Component = () => {
      useIO('/path')
      throw new Error('Optimistic subscription is left hanging.')
    }

    class ErrorBoundary extends React.Component {
      state = {hasError: false}

      static getDerivedStateFromError() {
        return {hasError: true}
      }

      render() {
        if (this.state.hasError) {
          return <div>Error</div>
        }

        return <Component />
      }
    }

    render(<ErrorBoundary />, {
      wrapper: (props) => <IOProvider {...props} io={io} />,
    })

    expect(document.body.textContent).toMatch('Error')

    expect(subscriptions).toBe(1)

    pruneCache()

    expect(subscriptions).toBe(0)
  })
})
