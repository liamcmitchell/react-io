import React from 'react'
import flowRight from 'lodash/flowRight'

import urlFirstApi from './urlFirstApi'
import allowRecursion from './source/allowRecursion'
import ensureStandardRequest from './source/ensureStandardRequest'
import allowNesting from './source/allowNesting'
import handleMultipleUrls from './source/handleMultipleUrls'
import cache from './source/cache'
import Observable from './Observable'

export default function createIO(source) {
  return urlFirstApi(
    // Compose middleware wrappers, order is important.
    flowRight([
      handleMultipleUrls,
      allowNesting,
      cache,
      allowRecursion,
      ensureStandardRequest
    ])(source),

    // Add methods to prototype.
    {
      getObservable: function() {
        return this.call({method: 'OBSERVE'})
      },

      // Allows use as observable.
      subscribe: function() {
        const o = this.getObservable()
        return o.subscribe.apply(o, arguments)
      },

      getPromise: function() {
        return this.call({method: 'GET'})
      },

      // Allows use as promise.
      next: function() {
        const p = this.getPromise()
        return p.next.apply(p, arguments)
      },

      set: function(value) {
        return this.call({
          method: 'SET',
          value: value
        })
      },

      render: function(renderValue, renderWaiting, renderError) { // eslint-disable-line
        return (
          <Observable
            observable={this.getObservable()}
            renderValue={renderValue}
            renderWaiting={renderWaiting}
            renderError={renderError}
          />
        )
      }
    }
  )
}
