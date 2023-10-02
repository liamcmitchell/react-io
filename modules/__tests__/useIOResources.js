/* eslint-disable react/prop-types */
import React from 'react'
import {render} from '@testing-library/react'
import {useIOResources} from '../useIOResources'
import {IOProvider} from '../context'
import {of, Subject, Observable} from 'rxjs'
import {act} from 'react-dom/test-utils'

describe('useIOResources', () => {
  it('requests simple path and path with params', () => {
    const io = (...args) => of(args)

    const Component = () => {
      const results = useIOResources({
        a: '/path',
        b: ['/path', {params: 1}],
      })

      return JSON.stringify(results)
    }

    render(<Component />, {
      wrapper: (props) => <IOProvider {...props} io={io} />,
    })

    expect(JSON.parse(document.body.textContent)).toEqual({
      a: {loading: false, value: ['/path']},
      b: {loading: false, value: ['/path', {params: 1}]},
    })
  })

  it('has loading, value and error states', () => {
    const subject = new Subject()
    const io = () => subject

    const Component = () => {
      const results = useIOResources({
        a: '/path',
      })

      return JSON.stringify(results)
    }

    render(<Component />, {
      wrapper: (props) => <IOProvider {...props} io={io} />,
    })

    expect(JSON.parse(document.body.textContent)).toEqual({
      a: {
        loading: true,
        value: undefined,
        error: undefined,
      },
    })

    act(() => {
      subject.next(1)
    })

    expect(JSON.parse(document.body.textContent)).toEqual({
      a: {
        loading: false,
        value: 1,
        error: undefined,
      },
    })

    act(() => {
      subject.next(2)
    })

    expect(JSON.parse(document.body.textContent)).toEqual({
      a: {
        loading: false,
        value: 2,
        error: undefined,
      },
    })

    act(() => {
      subject.error('ERR')
    })

    expect(JSON.parse(document.body.textContent)).toEqual({
      a: {
        loading: false,
        value: 2,
        error: 'ERR',
      },
    })
  })

  it('avoids resubscribing for the same request', () => {
    let subscriptions = 0
    const io = () =>
      new Observable((observer) => {
        ++subscriptions
        observer.next(1)
      })

    let renders = 0
    const Component = () => {
      renders++
      const {
        a: {value},
      } = useIOResources({
        a: '/path',
      })

      return value
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

  it('subscribes to new observable, unsubscribes from old', () => {
    const subscriptions = {}
    const io = (path) =>
      new Observable((observer) => {
        subscriptions[path] ||= 0
        subscriptions[path]++
        observer.next(path)
        return () => {
          subscriptions[path]--
        }
      })

    let renders = 0
    const Component = ({path}) => {
      renders++
      const {
        a: {value},
      } = useIOResources({a: path})

      return value
    }

    const {rerender, unmount} = render(<Component path="/path1" />, {
      wrapper: (props) => <IOProvider {...props} io={io} />,
    })

    expect(document.body.textContent).toBe('/path1')
    expect(subscriptions).toEqual({
      '/path1': 1,
      '/path2': undefined,
    })

    rerender(<Component path="/path2" />)

    expect(renders).toBeGreaterThanOrEqual(2)
    expect(subscriptions).toEqual({
      '/path1': 0,
      '/path2': 1,
    })
    expect(document.body.textContent).toBe('/path2')

    unmount()

    expect(subscriptions).toEqual({
      '/path1': 0,
      '/path2': 0,
    })
  })
})
