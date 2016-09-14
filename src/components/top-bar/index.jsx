import React from 'react'
import autobind from 'autobind-decorator'
import EventEmitter from 'event-emitter'

import styles from './styles.css'

@autobind
export default class TopBar extends React.Component {

  static contextTypes = {
    ee: React.PropTypes.object.isRequired,
  }

  onFilesSelected(event) {
    this.context.ee.emit('filesSelected', this.refs.fileInput.files)
    this.refs.fileInput.value = null
  }

  render = () => (
    <div className={styles.topBar}>
      <input ref="fileInput" type="file" multiple={true} onChange={this.onFilesSelected.bind(this)} />
    </div>
  )
}
