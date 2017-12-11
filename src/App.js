import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import Home from './Home'
import Message from './Message'
import './App.css'

class App extends Component {
  render() {
    return (
      <Router>
        <div>
          <Route exact component={ Home } path="/" />
          <Route component={ Message }  path="/message/:txhash" />
        </div>
      </Router>
    )
  }
}

export default App
