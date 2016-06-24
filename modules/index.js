export render from './render'
export IOProvider from './IOProvider'
export withIO from './withIO'

import render from './render'
let renderIOWarned = false
export function renderIO() {
  if (!renderIOWarned) {
    console.warn('Deprecated: renderIO has been renamed render')
    renderIOWarned = true
  }
  return render.apply(this, arguments)
}
