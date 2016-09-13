import React from 'react'
import autobind from 'autobind-decorator'
import EventEmitter from 'event-emitter'

import FileSelector from './file-selector'

@autobind
export default class App extends React.Component {
  render() {
    return <FileSelector zone={window} />
  }
}
