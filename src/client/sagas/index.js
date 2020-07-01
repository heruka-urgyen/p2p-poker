import {all, apply, put, takeEvery, takeLatest, select} from 'redux-saga/effects'

import {connectToWebsocket} from './websocket'

import {safe} from 'client/util'

const getInitialState = socket => function* (action) {
  yield apply(socket, socket.emit, ['INITIALIZE'])
}

const sitUser = socket => function* (action) {
  yield apply(socket, socket.emit, ['SIT_USER', action.payload])
}

const maybeNextRound = socket => function* (action) {
  const round = yield select(state => state.round)
  const table = yield select(state => state.table)

  if (safe(false)(() => round.status === 'FINISHED') && table.players.length > 1) {
    yield put({type: 'NEXT_ROUND'})
  }
}

const nextRound = socket => function* (action) {
  yield apply(socket, socket.emit, ['NEXT_ROUND'])
}

const nextRoundSuccess = socket => function* (action) {
  yield put({type: 'POST_BLINDS'})
}

const postBlinds = socket => function* (action) {
  yield apply(socket, socket.emit, ['POST_BLINDS'])
}

function* subscribe(socket) {
  yield takeEvery('INITIALIZE', getInitialState(socket))
  yield takeEvery('SIT_USER', sitUser(socket))
  yield takeEvery('UPDATE_TABLE_PLAYERS', maybeNextRound(socket))
  yield takeEvery('NEXT_ROUND', nextRound(socket))
  yield takeEvery('NEXT_ROUND_SUCCESS', nextRoundSuccess(socket))
  yield takeLatest('POST_BLINDS', postBlinds(socket))
}

function* initialize() {
  yield put({type: 'INITIALIZE'})
}

function* mainSaga() {
  yield all([
    connectToWebsocket(),
    initialize(),
  ])
}

export {subscribe}
export default mainSaga
