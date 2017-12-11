import React, { Component } from 'react'
import { Link, Redirect } from 'react-router-dom'
import './App.css'
import qr from './qr.png'
import nem from 'nem-sdk'
import copy from 'copy-to-clipboard'

const hexToUtf8 = nem.utils.format.hexToUtf8
const myAddress = 'NDHVB5-XDVQ7Q-FOYK6Z-UXTT7Q-PLH36Z-LKDSJQ-NXRL'

class Home extends Component {
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

  componentDidMount() {
    const address = myAddress
    const endpoint = nem.model.objects.create('endpoint')(this.getEndpoint(), nem.model.nodes.websocketPort)
    const connector = nem.com.websockets.connector.create(endpoint, address)

    connector.connect().then(() => {
      nem.com.websockets.subscribe.account.transactions.recent(connector, this.recentTransactionsHandler.bind(this))
      nem.com.websockets.subscribe.account.transactions.confirmed(connector, this.confirmedTransactionHandler.bind(this))
      nem.com.websockets.requests.account.transactions.recent(connector)
    }, err => {
      console.log('error', err)
    })
  }

  getEndpoint() {
    const mainnet = nem.model.nodes.mainnet
    const target_node = mainnet[Math.floor(Math.random() * (mainnet.length - 2)) + 1]

    return target_node.uri
  }

  recentTransactionsHandler(res) {
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

  confirmedTransactionHandler(res) {
    const posts = []
    if (res.transaction.message.payload) {
      posts.unshift({
        hash: res.meta.hash.data,
        timeStamp: (new Date(res.transaction.timeStamp * 1000 + Date.UTC(2015, 2, 29, 0, 6, 25, 0))).toString(),
        amount: res.transaction.amount,
        message: hexToUtf8( res.transaction.message.payload )
      });
    }
    this.setState({ posts })
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
    const txhash = this.props.location.hash
    const { posts, messageStyle, copied, showQr } = this.state
    return (
      <div>
        {txhash !== '' ? <Redirect push to={`/message/${txhash.slice(1)}`} /> : null}
        <div className="container">
          <header className="header">
            <h1 className="title">
              <span className="orange">N</span><span className="blue">E</span><span className="green">M</span>essage
            </h1>
            <p className="small">
              NEMを使って、メッセージを伝えよう。詳しくは<a href="https://coin.y-temp4.com/nemessage%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9/" rel="noopener noreferrer" target="_blank">こちら</a>
            </p>
            {showQr && <div className="qr-area">
              <img src={qr} alt="QR" />
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
                    <Link to={{
                      pathname: `/message/${post.hash}`,
                      state: { message: post.message, messageStyle }
                    }}>
                      メッセージを単独で表示
                    </Link>
                  </div>
                )}
              </div>
            }
          </section>
        </div>
      </div>
    )
  }
}

export default Home
