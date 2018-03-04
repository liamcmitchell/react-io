import React from 'react'
import {mount} from 'enzyme'
import withObservables from '../withObservables'
import Rx from 'rxjs'

describe('withObservables', () => {
  it('adds observable value to props', () => {
    const SimpleObservable = withObservables({
      val: Rx.Observable.of('VAL'),
    })(({val}) => <div>{val}</div>)

    const wrapper = mount(<SimpleObservable />)

    expect(wrapper.text()).toBe('VAL')
  })
})
