import {fork, take, put, call} from 'redux-saga/effects'
import {eventChannel} from 'redux-saga'
import {subscribe} from './index.js'

import io from 'socket.io-client'
import Peer from 'peerjs'

const createWebSocketConnection = () => io('http://localhost:3001')

const P2PSERVER = {host: 'localhost', port: '9000', path: '/poker'}

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

function createP2PConnectionChannel(peer) {
  return eventChannel(emit => {
    peer.on('connection', connection => emit(connection))

    return () => {
    }
  })
}

function createP2PChannel(connection) {
  return eventChannel(emit => {
    connection.on('data', data => emit(data))

    return () => {
    }
  })
}

export function* connectP2P(id) {
  const peer = yield call(() => new Peer(id, P2PSERVER))

  const connectionChannel = yield call(createP2PConnectionChannel, peer)
  const connection = yield take(connectionChannel)
  const p2pChannel = yield call(createP2PChannel, connection)

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
