import React from 'react'
import Observable from './Observable'

// Intended to be added to IO prototype.
export default function render(renderValue, renderWaiting, renderError) { // eslint-disable-line
  return (
    <Observable
      observable={this}
      renderValue={renderValue}
      renderWaiting={renderWaiting}
      renderError={renderError}
    />
  )
}
