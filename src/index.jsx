import React from 'react'
import ReactDOM from 'react-dom'

import App from './components/App'
import registerServiceWorker from 'serviceworker!./serviceworker.js'
import db from './indexedDB'

registerServiceWorker({scope: '/'}).catch(error => console.log)

const app = <App />
const mount = document.getElementById('app')

ReactDOM.render(app, mount)
