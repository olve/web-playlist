import React from 'react'
import autobind from 'autobind-decorator'
import EventEmitter from 'event-emitter'

@autobind
export default class FileSelector extends React.Component {

  static propTypes = {
    zone: React.PropTypes.any.isRequired,
  }
  static contextTypes = {
    ee: React.PropTypes.object.isRequired,
  }

  componentDidMount() {
    this.props.zone.addEventListener("dragenter", this.dragEnter)
    this.props.zone.addEventListener("dragover", this.dragOver)
    this.props.zone.addEventListener("dragleave", this.dragLeave)
    this.props.zone.addEventListener("drop", this.drop)
  }
  componentWillUnount() {
    this.props.zone.removeEventListener("dragenter", this.dragEnter)
    this.props.zone.removeEventListener("dragover", this.dragOver)
    this.props.zone.removeEventListener("dragleave", this.dragLeave)
    this.props.zone.removeEventListener("drop", this.drop)
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

    //break listener if user dropped something other than file(s)
    if (!event.dataTransfer.files.length) return

    event = this.cancelEvent(event)
    event.dataTransfer.dropEffect = "copy"
    for (let i=0, fileData; fileData = event.dataTransfer.files[i]; i++) {
      console.log(fileData)
    }
  }

  render() {
    return null
  }
}
