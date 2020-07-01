import {all, apply, put, takeEvery} from 'redux-saga/effects'

import {connectToWebsocket} from './websocket'

const getUser = socket => function* (action) {
  yield apply(socket, socket.emit, ['GET_USER'])
}

const getTable = socket => function* (action) {
  yield apply(socket, socket.emit, ['GET_TABLE'])
}

const getRound = socket => function* (action) {
  yield apply(socket, socket.emit, ['GET_ROUND'])
}

const sitUser = socket => function* (action) {
  yield apply(socket, socket.emit, ['SIT_USER', action.payload])
}

function* subscribe(socket) {
  yield takeEvery('GET_USER', getUser(socket))
  yield takeEvery('GET_TABLE', getTable(socket))
  yield takeEvery('GET_ROUND', getRound(socket))
  yield takeEvery('SIT_USER', sitUser(socket))
}

function* initialize() {
  yield put({type: 'GET_USER'})
  yield put({type: 'GET_TABLE'})
  yield put({type: 'GET_ROUND'})
}

function* mainSaga() {
  yield all([
    connectToWebsocket(),
    initialize(),
  ])
}

export {subscribe}
export default mainSaga
