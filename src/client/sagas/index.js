import {all, apply, put, takeEvery, select} from 'redux-saga/effects'

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

const maybeNextRound = socket => function* (action) {
  const round = yield select(state => state.round)
  const table = yield select(state => state.table)

  if (round.status === 'FINISHED' && table.players.length > 1) {
    yield put({type: 'NEXT_ROUND'})
  }
}

const nextRound = socket => function* (action) {
  yield apply(socket, socket.emit, ['NEXT_ROUND'])
}

function* subscribe(socket) {
  yield takeEvery('GET_USER', getUser(socket))
  yield takeEvery('GET_TABLE', getTable(socket))
  yield takeEvery('GET_ROUND', getRound(socket))
  yield takeEvery('SIT_USER', sitUser(socket))
  yield takeEvery('UPDATE_TABLE_SUCCESS', maybeNextRound(socket))
  yield takeEvery('NEXT_ROUND', nextRound(socket))
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
