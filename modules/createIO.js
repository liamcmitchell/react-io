import React from 'react'
import flowRight from 'lodash/flowRight'
import urlFirstApi from './urlFirstApi'

import wrapMultipleUrls from './source/wrapMultipleUrls'
import wrapNesting from './source/wrapNesting'
import wrapCache from './source/wrapCache'
import wrapRecursion from './source/wrapRecursion'
import wrapStandardRequest from './source/wrapStandardRequest'

import Observable from './Observable'

export default function createIO(source) {
  return urlFirstApi(
    // Compose middleware wrappers, order is important.
    flowRight([
      wrapMultipleUrls,
      wrapNesting,
      wrapCache,
      wrapRecursion,
      wrapStandardRequest
    ])(source),

    // Add methods to prototype.
    {
      render: function(renderValue, renderWaiting, renderError) { // eslint-disable-line
        return (
          <Observable
            observable={this}
            renderValue={renderValue}
            renderWaiting={renderWaiting}
            renderError={renderError}
          />
        )
      }
    }
  )
}
