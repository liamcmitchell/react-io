import React from 'react'
import {render} from 'enzyme'
import {getContext} from 'recompose'
import {IOProvider} from '../IOProvider'
import {context} from '../context'

const TestComponent = getContext(context)(({io}) => <div>{io()}</div>)

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
