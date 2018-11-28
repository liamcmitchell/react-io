import React from 'react'
import {IOProvider, Consumer} from '../context'
import {mount} from 'enzyme'

describe('IOProvider', () => {
  it('passes io through context', () => {
    const wrapper = mount(
      <IOProvider io={() => 'VAL'}>
        <Consumer>{(io) => <div>{io()}</div>}</Consumer>
      </IOProvider>
    )

    wrapper.update()

    expect(wrapper.text()).toMatch('VAL')
  })
})
