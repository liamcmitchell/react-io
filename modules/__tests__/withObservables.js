import React from 'react'
import {mount} from 'enzyme'
import {withObservables} from '../withObservables'
import Rx from 'rxjs'

const Child = (props) => <div>{JSON.toString(props)}</div>

describe('withObservables', () => {
  it('adds static observable value to props', () => {
    const WithObservables = withObservables({
      val: Rx.Observable.of('VAL'),
    })(Child)

    const wrapper = mount(
      <WithObservables val="will be overridden" otherProp />
    )

    expect(wrapper.find('Child').props()).toMatchObject({
      val: 'VAL',
      otherProp: true,
    })
  })

  it('avoids resubscribing static observables', () => {
    let subscriptions = 0

    const WithObservables = withObservables({
      val: Rx.Observable.create((observer) => {
        subscriptions += 1
        observer.next('VAL')
      }),
    })(Child)

    const wrapper = mount(<WithObservables other="1" />)

    expect(wrapper.find('Child').props()).toMatchObject({
      val: 'VAL',
      other: '1',
    })

    wrapper.setProps({other: '2'})

    expect(wrapper.find('Child').props()).toMatchObject({
      val: 'VAL',
      other: '2',
    })

    expect(subscriptions).toBe(1)
  })

  it('adds dynamic observable value to props', () => {
    const WithObservables = withObservables(({inputVal}) => ({
      val: Rx.Observable.of(inputVal),
    }))(Child)

    const wrapper = mount(
      <WithObservables inputVal="VAL" val="will be overridden" otherProp />
    )

    expect(wrapper.find('Child').props()).toMatchObject({
      inputVal: 'VAL',
      val: 'VAL',
      otherProp: true,
    })
  })

  it('renders null with empty observable object', () => {
    // Shouldn't ever pass in an empty object but test is here
    // to make sure behavior stays consistent.
    const WithObservables = withObservables({})(Child)

    const wrapper = mount(<WithObservables />)

    expect(wrapper.children()).toHaveLength(0)
  })

  it('subscribes to next observables before unsubscribing from previous', () => {
    // This is to prevent refCount observables from unsubscribing.
    const events = []

    const observable = (name) =>
      new Rx.Observable(() => {
        events.push(`subscribe ${name}`)
        return () => {
          events.push(`unsubscribe ${name}`)
        }
      })

    const WithObservables = withObservables(({name}) => ({
      val: observable(name),
    }))(Child)

    const wrapper = mount(<WithObservables name="1" />)
    wrapper.setProps({name: 2})
    wrapper.setProps({name: 3})
    wrapper.unmount()

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
      const asyncVal = new Rx.Subject()
      const WithObservables = withObservables({
        val: Rx.Observable.of('VAL'),
        asyncVal,
      })(Child)

      const wrapper = mount(<WithObservables />)

      wrapper.setProps({val: 'trigger componentWillReceiveProps'})

      expect(wrapper.children()).toHaveLength(0)

      asyncVal.next('ASYNC')
      wrapper.update()

      expect(wrapper.find('Child').props()).toMatchObject({
        val: 'VAL',
        asyncVal: 'ASYNC',
      })
    })

    it('only re-renders when all observables have emitted again', () => {
      // This behavior ensures that observable values always match the props
      // that were used to create them.
      const asyncVal = new Rx.Subject()
      const WithObservables = withObservables({
        asyncVal,
      })(Child)

      const wrapper = mount(<WithObservables />)

      asyncVal.next('ASYNC1')
      wrapper.update()

      expect(wrapper.find('Child').props()).toMatchObject({
        asyncVal: 'ASYNC1',
      })

      wrapper.setProps({newProp: 1})

      expect(wrapper.find('Child').props()).toMatchObject({
        asyncVal: 'ASYNC1',
      })

      asyncVal.next('ASYNC2')
      wrapper.update()

      expect(wrapper.find('Child').props()).toMatchObject({
        newProp: 1,
        asyncVal: 'ASYNC2',
      })
    })
  })

  describe('startWith provided', () => {
    it('renders while waiting for values', () => {
      // TODO: Remove in favor of startWith operator.
      const StartWith = () => null
      const asyncVal = new Rx.Subject()

      const WithObservables = withObservables(
        () => ({
          asyncVal,
        }),
        {startWith: StartWith}
      )(Child)

      const wrapper = mount(<WithObservables />)

      expect(wrapper.find('StartWith')).toHaveLength(1)
      expect(wrapper.find('Child')).toHaveLength(0)

      asyncVal.next(1)
      wrapper.update()
      expect(wrapper.find('StartWith')).toHaveLength(0)
      expect(wrapper.find('Child')).toHaveLength(1)

      wrapper.setProps({})
      expect(wrapper.find('StartWith')).toHaveLength(1)
      expect(wrapper.find('Child')).toHaveLength(0)
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
      const WithObservables = withObservables({
        val: Rx.Observable.throw(new Error('ERR')),
      })(Child)

      expect(() => {
        mount(<WithObservables />)
      }).toThrow(/ERR/)
    })
  })

  describe('error provided', () => {
    it('renders when observable throws', () => {
      const ErrorComponent = () => null

      const WithObservables = withObservables(
        {
          val: Rx.Observable.throw(new Error('ERR')),
        },
        {error: ErrorComponent}
      )(Child)

      const wrapper = mount(<WithObservables />)

      expect(wrapper.find('ErrorComponent').props()).toMatchObject({
        error: expect.objectContaining({message: 'ERR'}),
      })
      expect(wrapper.find('Child')).toHaveLength(0)
    })
  })
})
