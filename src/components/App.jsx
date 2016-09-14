import React from 'react'
import autobind from 'autobind-decorator'
import EventEmitter from 'event-emitter'

import FileSelector from './file-selector'

@autobind
export default class App extends React.Component {

  constructor() {
    super()
    this.ee = new EventEmitter()
  }

  static childContextTypes = {
    ee: React.PropTypes.object,
  }
  getChildContext = () => ({
      ee: this.ee,
  })

  render = () => (
      <div>
        <FileSelector zone={window} />
      </div>
  )
}
