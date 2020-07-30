/* eslint-disable react/prop-types */
import React from 'react'
import {mount} from 'enzyme'
import {useIO} from '../useIO'
import {IOProvider} from '../context'
import {of, BehaviorSubject, Subject} from 'rxjs'
import {createIO} from 'url-io'
import {suspend} from '../suspense'

jest.mock('../suspense', () => ({
  suspend: jest.fn((promise) => {
    throw promise
  }),
}))

afterEach(() => {
  suspend.mockClear()
})

describe('useIO', () => {
  it('returns io with no args', () => {
    const io = () => 'io!'

    const Component = () => {
      const io = useIO()

      return <div>{io()}</div>
    }

    const wrapper = mount(<Component />, {
      wrappingComponent: IOProvider,
      wrappingComponentProps: {io},
    })

    expect(wrapper.text()).toBe('io!')
  })

  it('returns path result', () => {
    const io = (request) => of(request)

    const Component = () => {
      const result = useIO('/path')

      return <div>{result}</div>
    }

    const wrapper = mount(<Component />, {
      wrappingComponent: IOProvider,
      wrappingComponentProps: {io},
    })

    expect(wrapper.text()).toBe('/path')
  })

  it('returns path & params result', () => {
    const io = createIO((request) => request)

    const Component = () => {
      const result = useIO('/path', {a: 1})

      return <div>{JSON.stringify(result)}</div>
    }

    const wrapper = mount(<Component />, {
      wrappingComponent: IOProvider,
      wrappingComponentProps: {io},
    })

    expect(wrapper.text()).toMatch('"originalPath":"/path"')
    expect(wrapper.text()).toMatch('"params":{"a":1}')
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

    const wrapper = mount(<Component />, {
      wrappingComponent: IOProvider,
      wrappingComponentProps: {io},
    })

    expect(wrapper.text()).toBe('1')

    wrapper.update()

    expect(renders).toBeGreaterThanOrEqual(2)
    expect(subscriptions).toBe(1)
    expect(wrapper.text()).toBe('1')
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

    const wrapper = mount(<Component a={1} />, {
      wrappingComponent: IOProvider,
      wrappingComponentProps: {io},
    })

    expect(wrapper.text()).toBe('1')

    wrapper.setProps({a: 2})

    expect(renders).toBeGreaterThanOrEqual(2)
    expect(subscriptions).toBe(2)
    expect(wrapper.text()).toBe('2')
  })

  describe('errors ', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      console.error.mockRestore() // eslint-disable-line
    })

    // Testing suspense is not well supported.
    it('suspends if value does not resolve immediately', async () => {
      const subject = new Subject()
      const io = createIO(() => subject)

      const Component = () => {
        const result = useIO('/path')

        return <div>{JSON.stringify(result)}</div>
      }

      let caughtError

      class ErrorBoundary extends React.Component {
        state = {error: false}

        static getDerivedStateFromError(error) {
          caughtError = error
          return {error: true}
        }

        render() {
          return this.state.error ? null : this.props.children
        }
      }

      mount(
        <ErrorBoundary>
          <Component />
        </ErrorBoundary>,
        {
          wrappingComponent: IOProvider,
          wrappingComponentProps: {io},
        }
      )

      // Test that React reports suspense.
      expect(caughtError).toBeDefined()
      expect(caughtError.message).toMatch('Component suspended while rendering')

      // Test that our helper suspend function was called with a promise.
      expect(suspend).toHaveBeenCalledWith(expect.any(Promise))

      // Test that the promise resolves.
      subject.next(1)
      await suspend.mock.calls[0][0]
    })

    it('throws when passing method', () => {
      const io = createIO((request) => request)

      const Component = () => {
        const result = useIO('/path', 'POST')

        return <div>{JSON.stringify(result)}</div>
      }

      expect(() => {
        mount(<Component />, {
          wrappingComponent: IOProvider,
          wrappingComponentProps: {io},
        })
      }).toThrowError('Params must be an object.')
    })

    it('throws error from request', () => {
      const io = createIO(() => {
        throw new Error('ERR')
      })

      const Component = () => {
        const result = useIO('/path')

        return <div>{JSON.stringify(result)}</div>
      }

      expect(() => {
        mount(<Component />, {
          wrappingComponent: IOProvider,
          wrappingComponentProps: {io},
        })
      }).toThrowError('ERR')
    })

    it('throws async error that can be caught by react boundary', () => {
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

      const wrapper = mount(
        <ErrorBoundary>
          <Component />
        </ErrorBoundary>,
        {
          wrappingComponent: IOProvider,
          wrappingComponentProps: {io},
        }
      )

      expect(wrapper.text()).toMatch('x')

      errorSubject.error(new Error('ERR'))
      wrapper.update()

      expect(wrapper.text()).toMatch('Error')
    })
  })
})
