import React from 'react'
import ReactDOM from 'react-dom'

import App from './components/App'
import registerServiceWorker from 'serviceworker!./serviceworker.js'

registerServiceWorker({scope: '/'}).catch(error => console.log)


const app = <App />
const mount = document.getElementById('app')

document.getElementById('page-loading-indicator').remove()

ReactDOM.render(app, mount)
