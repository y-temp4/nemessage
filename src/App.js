import React, { Component } from 'react'
import './App.css'
import qr from './qr.png'
import nem from 'nem-sdk'
import copy from 'copy-to-clipboard'

const hexToUtf8 = nem.utils.format.hexToUtf8
const myAddress = 'NDHVB5-XDVQ7Q-FOYK6Z-UXTT7Q-PLH36Z-LKDSJQ-NXRL'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      posts: [],
      message: null,
      messageStyle: 'default',
      copied: false,
      showQr: false,
    }
  }

  getEndpoint() {
    const mainnet = nem.model.nodes.mainnet
    const target_node = mainnet[Math.floor(Math.random()* (mainnet.length - 2)) + 1]

    return target_node.uri
  }

  recent_transactions_handler(res) {
    const posts = []
    res.data.map(d => {
      if(d.transaction.message !== undefined){
        posts.push({
          hash: d.meta.hash.data,
          timeStamp: (new Date(d.transaction.timeStamp * 1000 + Date.UTC(2015, 2, 29, 0, 6, 25, 0))).toString(),
          amount: d.transaction.amount,
          message: hexToUtf8( d.transaction.message.payload )
        })
      }
    })
    this.setState({ posts })
  }

  confirmed_transaction_handler(res) {
    const posts = []
    console.log("confirmed_transaction_handler", res)
    if (res.transaction.message.payload) {
      console.log(res.transaction)
      posts.unshift({
        hash: res.meta.hash.data,
        timeStamp: (new Date(res.transaction.timeStamp * 1000 + Date.UTC(2015, 2, 29, 0, 6, 25, 0))).toString(),
        amount: res.transaction.amount,
        message: hexToUtf8( res.transaction.message.payload )
      });
    }
    this.setState({ posts })
  }

  showMessage(e) {
    const txhash = e.target.href.split('#')[1]
    this.setState({ message: '取得中...' })
    this.fetchMessage(txhash)
  }

  reset() {
    this.setState({ message: null, messageStyle: 'default', copied: false, showQr: false })
  }

  componentDidMount() {
    const address = myAddress
    const endpoint = nem.model.objects.create("endpoint")(this.getEndpoint(), nem.model.nodes.websocketPort)
    const connector = nem.com.websockets.connector.create(endpoint, address)

    connector.connect().then(() => {
      nem.com.websockets.subscribe.account.transactions.recent(connector, this.recent_transactions_handler.bind(this))
      nem.com.websockets.subscribe.account.transactions.confirmed(connector, this.confirmed_transaction_handler.bind(this))
      nem.com.websockets.requests.account.transactions.recent(connector)
    }, err => {
      console.log('error', err)
    })

    const txhash = window.location.href.split('#')[1]
    if (txhash) {
      if (txhash === 'TOP') {
        this.reset()
      } else {
        this.fetchMessage(txhash)
      }
    }
  }

  fetchMessage(txhash) {
    fetch(`http://alice4.nem.ninja:7890/transaction/get?hash=${txhash}`)
      .then(res => res.json())
      .then(data => {
        if (data.transaction) {
          if (Object.keys(data.transaction.message).length !== 0) {
            const message = hexToUtf8(data.transaction.message.payload)
            this.setState({ message })
            if (data.transaction.amount >= 10000000) {
              this.setState({ messageStyle: 'rainbow' })
            } else if (data.transaction.amount >= 3000000) {
              this.setState({ messageStyle: 'orange' })
            } else if (data.transaction.amount >= 2000000) {
              this.setState({ messageStyle: 'blue' })
            } else if (data.transaction.amount >= 1000000) {
              this.setState({ messageStyle: 'green' })
            } else if (data.transaction.amount >= 500000) {
              this.setState({ messageStyle: 'rich' })
            }
          } else {
            this.setState({ message: 'メッセージがありません' })
          }
        } else {
          this.setState({ message: '取得できませんでした' })
        }
      })
  }

  copyAddress() {
    copy(myAddress)
    this.setState({ copied: true })
  }

  toggleQr() {
    const { showQr } = this.state
    this.setState({ showQr: !showQr })
  }

  render() {
    const { posts, message, messageStyle, copied, showQr } = this.state
    return (
      <div>
        { message === null ?
          <div className="container">
            <header className="header">
              <h1 className="title">
                <span className="orange">N</span><span className="blue">E</span><span className="green">M</span>essage
              </h1>
              <p className="small">
                NEMを使って、メッセージを伝えよう。詳しくは<a href="https://coin.y-temp4.com/nemessage%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9/" rel="noopener noreferrer" target="_blank">こちら</a>
              </p>
              {showQr && <div className="qr-area">
                <img src={qr} alt=""/>
              </div>}
              <p className="small">アドレス：{myAddress}</p>
              <button className="button" onClick={() => this.toggleQr()}>
                {showQr ? 'QRコードを隠す' : 'QRコードを表示する'}
              </button>
              <button className="button" onClick={() => this.copyAddress()}>
                {copied ? 'コピーしました！' : 'アドレスをコピーする'}
              </button>
            </header>
            <section className="main">
              {
                posts.length === 0 ?
                <p>取得中...</p> :
                <div>
                  {posts.map(post =>
                    <div key={post.timeStamp} className="message-overview">
                      <p className="message">{post.message}</p>
                      <a href={`#${post.hash}`} onClick={e => this.showMessage(e)}>
                        メッセージを単独で表示
                      </a>
                    </div>
                  )}
                </div>
              }
            </section>
          </div>
          :
          <section className="main">
            <div className={`message-box ${messageStyle}`}>
            <p className="message-box-inner-message">{message}</p>
            </div>
            <a href="#TOP" onClick={() => this.reset()}>トップに戻る</a>
          </section>
        }
      </div>
    )
  }
}

export default App
