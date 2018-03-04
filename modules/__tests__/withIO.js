import React from 'react'
import {mount} from 'enzyme'
import {withIO} from '../withIO'
import {IOProvider} from '../IOProvider'
import Rx from 'rxjs'

describe('withIO', () => {
  it('adds io value to props', () => {
    const Component = withIO({
      val: '/path',
    })(({val}) => <div>{val}</div>)

    const wrapper = mount(
      <IOProvider io={(request) => Rx.Observable.of(request)}>
        <Component />
      </IOProvider>
    )

    expect(wrapper.text()).toBe('/path')
  })
})
