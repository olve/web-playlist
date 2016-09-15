import React from 'react'
import autobind from 'autobind-decorator'
import EventEmitter from 'event-emitter'

import FileSelector from './file-selector'
import TopBar from './top-bar'
import Playlist from './playlist'

@autobind
export default class App extends React.Component {

  constructor(props) {
    super()
    this.ee = new EventEmitter()
    this.db = props.db
  }

  static propTypes = {
    db: React.PropTypes.object.isRequired,
  }

  static childContextTypes = {
    ee: React.PropTypes.object,
    db: React.PropTypes.object,
  }
  getChildContext = () => ({
    ee: this.ee,
    db: this.db
  })

  render = () => (
      <div>
        <FileSelector zone={window} />
        <TopBar />
        <Playlist />
      </div>
  )
}
