import React from 'react'
import autobind from 'autobind-decorator'
import EventEmitter from 'event-emitter'

@autobind
export default class FileSelector extends React.Component {

  static propTypes = {
    zone: React.PropTypes.element.isRequired,
  }

  componentDidMount() {
    const zone = this.props.zone
    zone.addEventListener("dragenter", this.dragEnter)
    zone.addEventListener("dragover", this.dragOver)
    zone.addEventListener("dragleave", this.dragLeave)
    zone.addEventListener("drop", this.drop)
  }
  componentWillUnount() {
    const zone = this.props.zone
    zone.removeEventListener("dragenter", this.dragEnter)
    zone.removeEventListener("dragover", this.dragOver)
    zone.removeEventListener("dragleave", this.dragLeave)
    zone.removeEventListener("drop", this.drop)
  }
  cancelEvent(event) {
    event.stopPropagation()
    event.preventDefault()
    return event
  }
  dragEnter = (event) => this.cancelEvent(event)
  dragOver = (event) => this.cancelEvent(event)
  dragLeave = (event) => this.cancelEvent(event)
  drop = (event) => {
    if (!event.dataTransfer.files.length) return
    event = this.cancelEvent(event)
    event.dataTransfer.dropEffect = "copy"
    for (let i=0, fileData; fileData = event.dataTransfer.files[i]; i++) {
      console.log(fileData)
    }
  }

  render() {
    return <p>dropzone</p>
  }
}
