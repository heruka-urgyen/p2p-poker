import {all, apply, call, put, takeEvery, select, delay} from 'redux-saga/effects'
import * as api from 'client/api'

import {connectToWebsocket} from './websocket'

import {safe} from 'client/util'

const getInitialState = function* (action) {
  try {
    const {payload} = yield call(api.get('table/initialize'), action.payload)

    yield put({type: 'INITIALIZE_SUCCESS', payload})
  } catch ({message}) {
    yield put({type: 'INITIALIZE_FAILURE', payload: {message}})
  }
}

function* sitUser(action) {
  try {
    const {payload} = yield call(api.post('table/sitUser'), action.payload)

    yield put({type: 'SIT_USER_SUCCESS', payload})
  } catch ({message}) {
    yield put({type: 'SIT_USER_FAILURE', payload: {message}})
  }
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
    yield put({type: 'END_ROUND', payload: {winners: [{playerId: round.players[0]}]}})
  }
}

const endRound = socket => function* (action) {
  yield apply(socket, socket.emit, ['END_ROUND', action])
}

const bet = socket => function* (action) {
  yield apply(socket, socket.emit, ['BET', action])
}

const betSuccess = socket => function* (action) {
  const user = yield select(state => state.user)
  const {round} = action.payload

  if (round.status === 'ALL_IN' && user.id === round.whoseTurn) {
    yield delay(500)
    yield put({type: 'BET', payload: {player: {id: round.whoseTurn}, amount: 0}})
  }
}

const showdownSuccess = socket => function* (action) {
  const round = yield select(state => state.round)

  yield delay(3000)
  yield put({type: 'END_ROUND', payload: {winners: round.winners}})
}

function* subscribe(socket) {
  yield takeEvery('INITIALIZE', getInitialState)
  yield takeEvery('SIT_USER', sitUser)
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
  yield takeEvery('BET', bet(socket))
  yield takeEvery('BET_SUCCESS', betSuccess(socket))
  yield takeEvery('SHOWDOWN_SUCCESS', showdownSuccess(socket))
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
