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
    socket.on('GET_PLAYERS_SUCCESS', handler('GET_PLAYERS_SUCCESS'))
    socket.on('GET_ROUND_SUCCESS', handler('GET_ROUND_SUCCESS'))
    socket.on('SIT_USER_SUCCESS', handler('SIT_USER_SUCCESS'))
    socket.on('GET_ROUND_SUCCESS', handler('GET_ROUND_SUCCESS'))
    socket.on('NEXT_ROUND_SUCCESS', handler('NEXT_ROUND_SUCCESS'))
    socket.on('UPDATE_TABLE_PLAYERS', handler('UPDATE_TABLE_PLAYERS'))

    return () => {
      socket.off('GET_USER_SUCCESS', handler('GET_USER_SUCCESS'))
      socket.off('GET_TABLE_SUCCESS', handler('GET_TABLE_SUCCESS'))
      socket.off('GET_PLAYERS_SUCCESS', handler('GET_PLAYERS_SUCCESS'))
      socket.off('GET_ROUND_SUCCESS', handler('GET_ROUND_SUCCESS'))
      socket.off('SIT_USER_SUCCESS', handler('SIT_USER_SUCCESS'))
      socket.off('GET_ROUND_SUCCESS', handler('GET_ROUND_SUCCESS'))
      socket.off('NEXT_ROUND_SUCCESS', handler('NEXT_ROUND_SUCCESS'))
      socket.off('UPDATE_TABLE_PLAYERS', handler('UPDATE_TABLE_PLAYERS'))
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
