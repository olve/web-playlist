import React from 'react'
import autobind from 'autobind-decorator'
import EventEmitter from 'event-emitter'

import FileSelector from './file-selector'

@autobind
export default class App extends React.Component {

  static childContextTypes = {
    ee: React.PropTypes.object,
  }
  getChildContext = () => ({
      ee: this.ee,
  })

  constructor(props) {
    super()
    this.ee = new EventEmitter()
  }

  render = () => (
      <div>
        <FileSelector zone={window} />
      </div>
  )
}
