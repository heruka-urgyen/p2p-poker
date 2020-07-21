import {apply, fork, take, put, call} from 'redux-saga/effects'
import {eventChannel} from 'redux-saga'
import {subscribe} from './index.js'

import io from 'socket.io-client'
import Peer from 'peerjs'

const createWebSocketConnection = () => io('http://localhost:3001')

const P2PSERVER = {host: 'localhost', port: '9000', path: '/poker', debug: 1}
const peers = {}

function createSocketChannel(socket) {
  return eventChannel(emit => {
    const handler = (type, {payload}) => {
      emit({type, payload})
    }

    socket.on('message', handler)

    return () => {
      socket.off('message', handler)
    }
  })
}

function createP2PChannel(peer) {
  return eventChannel(emit => {
    peer.on('connection', connection => {
      connection.on('open', () => {
        connection.on('data', data => {
          emit(data)
        })
      })

    })

    return () => {}
  })
}

function connectionOnOpen(connection) {
  return eventChannel(emit => {
    connection.on('open', () => {
      emit(connection)
    })

    return () => {
    }
  })
}

export function* connectP2P([peer, sendToPeers]) {
  while (true) {
    try {
      const {to, action} = yield take(sendToPeers)

      if (peer._id === to) {
        yield put(action)
      } else {
        const connection = yield apply(peer, peer.connect, [to])
        const c = yield take(yield call(connectionOnOpen, connection))

        yield apply(c, c.send, [action])
      }
    } catch(err) {
      console.error('p2p error:', err)
    }
  }
}

export function* createPeer([id, sendToPeers]) {
  const peer = yield call(() => new Peer(id, P2PSERVER))
  peers[id] = peer
  const p2pChannel = yield call(createP2PChannel, peer)
  yield fork(connectP2P, [peer, sendToPeers])

  while (true) {
    try {
      const action = yield take(p2pChannel)
      yield put(action)
    } catch(err) {
      console.error('p2p error:', err)
    }
  }
}

export function* connectToWebsocket() {
  const socket = yield call(createWebSocketConnection)
  const socketChannel = yield call(createSocketChannel, socket)

  yield fork(subscribe, socket)

  while (true) {
    try {
      const action = yield take(socketChannel)
      yield put(action)
    } catch(err) {
      console.error('socket error:', err)
    }
  }
}
