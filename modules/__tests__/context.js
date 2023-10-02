import React from 'react'
import {IOProvider, Consumer} from '../context'
import {render} from '@testing-library/react'

describe('IOProvider', () => {
  it('passes io through context', () => {
    render(
      <IOProvider io={() => 'VAL'}>
        <Consumer>{(io) => <div>{io()}</div>}</Consumer>
      </IOProvider>
    )

    expect(document.body.textContent).toBe('VAL')
  })
})
