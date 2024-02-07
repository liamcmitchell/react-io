import React from 'react'
import {act, render} from '@testing-library/react'
import {withIO} from '../withIO'
import {IOProvider} from '../context'
import {Observable, of, throwError, Subject, map} from 'rxjs'

const Child = (props) => <div>{JSON.stringify(props)}</div>

describe('withIO', () => {
  it('adds io to props', () => {
    const Component = withIO()(({io}) => <div>{io()}</div>)

    render(
      <IOProvider io={() => 'io!'}>
        <Component />
      </IOProvider>
    )

    expect(document.body.textContent).toBe('io!')
  })

  it('adds static io request to props', () => {
    const Component = withIO({
      val: '/path',
    })(({val}) => <div>{val}</div>)

    render(
      <IOProvider io={(request) => of(request)}>
        <Component />
      </IOProvider>
    )

    expect(document.body.textContent).toBe('/path')
  })

  it('adds dynamic io request to props', () => {
    const Component = withIO(({path}) => ({
      val: path,
    }))(({val}) => <div>{val}</div>)

    render(
      <IOProvider io={(request) => of(request)}>
        <Component path="/dynamicPath" />
      </IOProvider>
    )

    expect(document.body.textContent).toBe('/dynamicPath')
  })

  it('adds observable to props', () => {
    const Component = withIO(({io, path}) => ({
      val: io(path).pipe(map((val) => val + '!')),
    }))(({val}) => <div>{val}</div>)

    render(
      <IOProvider io={(request) => of(request)}>
        <Component path="/dynamicPath" />
      </IOProvider>
    )

    expect(document.body.textContent).toBe('/dynamicPath!')
  })

  it('adds static observable value to props', () => {
    const WithObservables = withIO({
      val: of('VAL'),
    })(Child)

    render(<WithObservables val="will be overridden" otherProp />)

    expect(JSON.parse(document.body.textContent)).toMatchObject({
      val: 'VAL',
      otherProp: true,
    })
  })

  it('avoids resubscribing static observables', () => {
    let subscriptions = 0

    const WithObservables = withIO({
      val: new Observable((observer) => {
        subscriptions += 1
        observer.next('VAL')
      }),
    })(Child)

    const {rerender} = render(<WithObservables other="1" />)

    expect(JSON.parse(document.body.textContent)).toMatchObject({
      val: 'VAL',
      other: '1',
    })

    rerender(<WithObservables other="2" />)

    expect(JSON.parse(document.body.textContent)).toMatchObject({
      val: 'VAL',
      other: '2',
    })

    expect(subscriptions).toBe(1)
  })

  it('adds dynamic observable value to props', () => {
    const WithObservables = withIO(({inputVal}) => ({
      val: of(inputVal),
    }))(Child)

    render(
      <WithObservables inputVal="VAL" val="will be overridden" otherProp />
    )

    expect(JSON.parse(document.body.textContent)).toMatchObject({
      inputVal: 'VAL',
      val: 'VAL',
      otherProp: true,
    })
  })

  it('renders empty observable object', () => {
    const WithObservables = withIO({})(Child)

    render(<WithObservables />)

    expect(JSON.parse(document.body.textContent)).toMatchObject({})
  })

  it('subscribes to next observables before unsubscribing from previous', () => {
    // This is to prevent refCount observables from unsubscribing.
    const events = []

    const observable = (name) =>
      new Observable(() => {
        events.push(`subscribe ${name}`)
        return () => {
          events.push(`unsubscribe ${name}`)
        }
      })

    const WithObservables = withIO(({name}) => ({
      val: observable(name),
    }))(Child)

    const {rerender, unmount} = render(<WithObservables name="1" />)
    rerender(<WithObservables name="2" />)
    rerender(<WithObservables name="3" />)
    unmount()

    expect(events).toMatchObject([
      'subscribe 1',
      'subscribe 2',
      'unsubscribe 1',
      'subscribe 3',
      'unsubscribe 2',
      'unsubscribe 3',
    ])
  })

  describe('startWith missing', () => {
    it('renders null until all observables have emitted', () => {
      const asyncVal = new Subject()
      const WithObservables = withIO({
        val: of('VAL'),
        asyncVal,
      })(Child)

      const {rerender} = render(<WithObservables />)

      rerender(<WithObservables val="try again" />)

      expect(document.body.textContent).toBe('')

      act(() => {
        asyncVal.next('ASYNC')
      })

      expect(JSON.parse(document.body.textContent)).toMatchObject({
        val: 'VAL',
        asyncVal: 'ASYNC',
      })
    })

    it('only re-renders when all observables have emitted again', () => {
      // This behavior ensures that observable values always match the props
      // that were used to create them.
      const subject = new Subject()
      const WithObservables = withIO(({outerProp}) => ({
        innerProp: subject.pipe(map(() => outerProp)),
      }))(Child)

      const {rerender} = render(<WithObservables outerProp={1} />)

      act(() => {
        subject.next()
      })

      expect(JSON.parse(document.body.textContent)).toEqual({
        outerProp: 1,
        innerProp: 1,
      })

      rerender(<WithObservables outerProp={2} />)

      expect(JSON.parse(document.body.textContent)).toEqual({
        outerProp: 1,
        innerProp: 1,
      })

      act(() => {
        subject.next()
      })

      expect(JSON.parse(document.body.textContent)).toEqual({
        outerProp: 2,
        innerProp: 2,
      })
    })
  })

  describe('startWith provided', () => {
    it('renders StartWith until all observables have emitted', () => {
      const StartWith = () => 'StartWith'
      const asyncVal = new Subject()
      const WithObservables = withIO(
        {
          val: of('VAL'),
          asyncVal,
        },
        {startWith: StartWith}
      )(Child)

      const {rerender} = render(<WithObservables />)

      rerender(<WithObservables val="try again" />)

      expect(document.body.textContent).toBe('StartWith')

      act(() => {
        asyncVal.next('ASYNC')
      })

      expect(JSON.parse(document.body.textContent)).toMatchObject({
        val: 'VAL',
        asyncVal: 'ASYNC',
      })
    })

    it('renders StartWith while waiting for new observables', () => {
      const StartWith = () => 'StartWith'
      const subject = new Subject()
      const WithObservables = withIO(
        ({outerProp}) => ({
          innerProp: subject.pipe(map(() => outerProp)),
        }),
        {startWith: StartWith}
      )(Child)

      const {rerender} = render(<WithObservables outerProp={1} />)

      act(() => {
        subject.next()
      })

      expect(JSON.parse(document.body.textContent)).toEqual({
        outerProp: 1,
        innerProp: 1,
      })

      rerender(<WithObservables outerProp={2} />)

      expect(document.body.textContent).toBe('StartWith')

      act(() => {
        subject.next()
      })

      expect(JSON.parse(document.body.textContent)).toEqual({
        outerProp: 2,
        innerProp: 2,
      })
    })
  })

  describe('error missing', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      console.error.mockRestore() // eslint-disable-line
    })

    test('throws error', () => {
      const WithObservables = withIO({
        val: throwError(new Error('ERR')),
      })(Child)

      expect(() => {
        render(<WithObservables />)
      }).toThrow(/ERR/)
    })
  })

  describe('error provided', () => {
    it('renders when observable throws', () => {
      const ErrorComponent = ({error}) => error.message

      const WithObservables = withIO(
        {
          val: throwError(new Error('ERR')),
        },
        {error: ErrorComponent}
      )(Child)

      render(<WithObservables />)

      expect(document.body.textContent).toBe('ERR')
    })
  })
})
