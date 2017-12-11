import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import nem from 'nem-sdk'

const hexToUtf8 = nem.utils.format.hexToUtf8

class Message extends Component {
  constructor(props) {
    super(props)
    const { message, messageStyle } = props.location.state || {}
    this.state = {
      message,
      messageStyle,
    }
  }

  componentDidMount() {
    const { txhash } = this.props.match.params
    this.fetchMessage(txhash)
  }

  fetchMessage(txhash) {
    fetch(`http://alice4.nem.ninja:7890/transaction/get?hash=${txhash}`)
      .then(res => res.json())
      .then(data => {
        if (data.transaction) {
          if (Object.keys(data.transaction.message).length !== 0) {
            const message = hexToUtf8(data.transaction.message.payload)
            this.setState({ message })
            const messageStyle = this.getStyle(data.transaction.amount)
            this.setState({ messageStyle })

          } else {
            this.setState({ message: 'メッセージがありません' })
          }
        } else {
          this.setState({ message: '取得できませんでした' })
        }
      })
  }

  getStyle(amount) {
    let style = 'default'
    if (amount >= 10000000) {
      style = 'rainbow'
    } else if (amount >= 3000000) {
      style = 'orange'
    } else if (amount >= 2000000) {
      style = 'blue'
    } else if (amount >= 1000000) {
      style = 'green'
    } else if (amount >= 500000) {
      style = 'rich'
    }
    return style
  }

  render() {
    const { message, messageStyle } = this.state
    return (
      <section className="main">
        <div className={`message-box ${messageStyle}`}>
        <p className="message-box-inner-message">{message}</p>
        </div>
        <Link to="/">トップに戻る</Link>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('NEMessageでメッセージを確認しよう！')}&hashtags=NEMessage`}
          className="tweet"
        >
          ツイートする
        </a>
      </section>
    )
  }
}

export default Message
