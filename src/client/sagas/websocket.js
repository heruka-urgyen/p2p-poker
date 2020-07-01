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

    socket.on('INITIALIZE_SUCCESS', handler('INITIALIZE_SUCCESS'))
    socket.on('SIT_USER_SUCCESS', handler('SIT_USER_SUCCESS'))
    socket.on('NEXT_ROUND_SUCCESS', handler('NEXT_ROUND_SUCCESS'))
    socket.on('UPDATE_TABLE_PLAYERS', handler('UPDATE_TABLE_PLAYERS'))
    socket.on('POST_BLINDS_SUCCESS', handler('POST_BLINDS_SUCCESS'))
    socket.on('DEAL_CARDS_SUCCESS', handler('DEAL_CARDS_SUCCESS'))

    return () => {
      socket.on('INITIALIZE_SUCCESS', handler('INITIALIZE_SUCCESS'))
      socket.off('SIT_USER_SUCCESS', handler('SIT_USER_SUCCESS'))
      socket.off('NEXT_ROUND_SUCCESS', handler('NEXT_ROUND_SUCCESS'))
      socket.off('UPDATE_TABLE_PLAYERS', handler('UPDATE_TABLE_PLAYERS'))
      socket.off('POST_BLINDS_SUCCESS', handler('POST_BLINDS_SUCCESS'))
      socket.off('DEAL_CARDS_SUCCESS', handler('DEAL_CARDS_SUCCESS'))

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
