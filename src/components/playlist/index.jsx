import React from 'react'
import autobind from 'autobind-decorator'

export default class App extends React.Component {

  static contextTypes = {
    ee: React.PropTypes.object.isRequired,
    db: React.PropTypes.object.isRequired,
  }

  render() {
    console.log(this.context.ee, this.context.db)
    return <p> playlist </p>
  }
}
