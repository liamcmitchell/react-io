import {suspend} from '../suspense'

describe('suspend', () => {
  it('throws what is given', () => {
    const error = new Error()
    expect(() => suspend(error)).toThrow(error)
  })
})
