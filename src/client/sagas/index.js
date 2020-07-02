import {all, apply, put, takeEvery, select} from 'redux-saga/effects'

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

const postBlindsSuccess = socket => function* (action) {
  yield put({type: 'DEAL_CARDS'})
}

const dealCards = socket => function* (action) {
  yield apply(socket, socket.emit, ['DEAL_CARDS'])
}

const fold = socket => function* (action) {
  yield apply(socket, socket.emit, ['FOLD', action])
}

const foldSuccess = socket => function* (action) {
  const round = yield select(state => state.round)

  if (round.players.length === 1) {
    yield put({type: 'END_ROUND', payload: {playerId: round.players[0]}})
  }
}

const endRound = socket => function* (action) {
  yield apply(socket, socket.emit, ['END_ROUND', action])
}

function* subscribe(socket) {
  yield takeEvery('INITIALIZE', getInitialState(socket))
  yield takeEvery('SIT_USER', sitUser(socket))
  yield takeEvery('UPDATE_TABLE_PLAYERS', maybeNextRound(socket))
  yield takeEvery('NEXT_ROUND', nextRound(socket))
  yield takeEvery('NEXT_ROUND_SUCCESS', nextRoundSuccess(socket))
  yield takeEvery('POST_BLINDS', postBlinds(socket))
  yield takeEvery('POST_BLINDS_SUCCESS', postBlindsSuccess(socket))
  yield takeEvery('DEAL_CARDS', dealCards(socket))
  yield takeEvery('FOLD', fold(socket))
  yield takeEvery('FOLD_SUCCESS', foldSuccess(socket))
  yield takeEvery('END_ROUND', endRound(socket))
  yield takeEvery('END_ROUND_SUCCESS', maybeNextRound(socket))
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
