import React from 'react'
import {mount} from 'enzyme'
import {withIO} from '../withIO'
import {IOProvider} from '../context'
import {of} from 'rxjs'
import {map} from 'rxjs/operators'

describe('withIO', () => {
  it('adds io to props', () => {
    const Component = withIO()(({io}) => <div>{io()}</div>)

    const wrapper = mount(
      <IOProvider io={() => 'io!'}>
        <Component />
      </IOProvider>
    )

    expect(wrapper.text()).toBe('io!')
  })

  it('adds static io request to props', () => {
    const Component = withIO({
      val: '/path',
    })(({val}) => <div>{val}</div>)

    const wrapper = mount(
      <IOProvider io={(request) => of(request)}>
        <Component />
      </IOProvider>
    )

    expect(wrapper.text()).toBe('/path')
  })

  it('adds dynamic io request to props', () => {
    const Component = withIO(({path}) => ({
      val: path,
    }))(({val}) => <div>{val}</div>)

    const wrapper = mount(
      <IOProvider io={(request) => of(request)}>
        <Component path="/dynamicPath" />
      </IOProvider>
    )

    expect(wrapper.text()).toBe('/dynamicPath')
  })

  it('adds observable to props', () => {
    const Component = withIO(({io, path}) => ({
      val: io(path).pipe(map((val) => val + '!')),
    }))(({val}) => <div>{val}</div>)

    const wrapper = mount(
      <IOProvider io={(request) => of(request)}>
        <Component path="/dynamicPath" />
      </IOProvider>
    )

    expect(wrapper.text()).toBe('/dynamicPath!')
  })
})
