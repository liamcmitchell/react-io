import React, {PropTypes} from 'react'

export default function contextProviderComponent(types, name = 'ContextProvider') {
  return React.createClass({
      displayName: name,
      propTypes: Object.assign({
        children: PropTypes.element
      }, types),
      childContextTypes: types,
      getChildContext() {
        const context = {}
        for (let key in types) {
          context[key] = this.props[key]
        }
        return context
      },
      render() {
        return this.props.children
      }
    })
}
