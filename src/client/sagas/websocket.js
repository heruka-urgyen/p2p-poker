import {fork, take, put, call} from 'redux-saga/effects'
import {eventChannel} from 'redux-saga'
import {subscribe} from './index.js'

import io from 'socket.io-client'
const createWebSocketConnection = () => io('http://localhost:3001')

function createSocketChannel(socket) {
  return eventChannel(emit => {
    const handler = type => ({payload}) => {
      emit({type, payload})
    }

    socket.on('GET_USER_SUCCESS', handler('GET_USER_SUCCESS'))
    socket.on('GET_TABLE_SUCCESS', handler('GET_TABLE_SUCCESS'))

    return () => {
      socket.off('GET_USER_SUCCESS', handler('GET_USER_SUCCESS'))
      socket.off('GET_TABLE_SUCCESS', handler('GET_TABLE_SUCCESS'))
    }
  })
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
