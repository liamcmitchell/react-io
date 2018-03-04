import React from 'react'
import {render} from 'enzyme'
import getContext from 'recompose/getContext'
import IOProvider from '../IOProvider'
import contextTypes from '../contextTypes'

const TestComponent = getContext(contextTypes)(({io}) => <div>{io()}</div>)

describe('IOProvider', () => {
  it('passes io through context', () => {
    const wrapper = render(
      <IOProvider io={() => 'VAL'}>
        <TestComponent />
      </IOProvider>
    )

    expect(wrapper.text()).toBe('VAL')
  })
})
