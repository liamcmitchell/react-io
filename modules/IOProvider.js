import {Component, PropTypes} from 'react'

export default class IOProvider extends Component {
  static propTypes = {
    children: PropTypes.element,
    io: PropTypes.func.isRequired
  }

  static childContextTypes = {
    io: PropTypes.func.isRequired
  }

  getChildContext() {
    return {
      io: this.props.io
    }
  }

  render() {
    return this.props.children
  }
}
