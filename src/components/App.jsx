import React from 'react'
import autobind from 'autobind-decorator'
import EventEmitter from 'event-emitter'

@autobind
export default class App extends React.Component {
  render() {
    return <p>hello world</p>
  }
}
