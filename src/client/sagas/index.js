import {channel} from 'redux-saga'
import {
  all,
  fork,
  apply,
  race,
  call,
  put,
  take,
  takeEvery,
  select,
  delay,
} from 'redux-saga/effects'
import {ROUND_STATUS, STREETS, STREET_STATUS} from '@heruka_urgyen/poker-solver'

import {connectToWebsocket, createPeer} from './websocket'
import {safe} from 'client/util'
import {v4} from 'uuid'

const getInitialState = sendToPeers => function* (action) {
  try {
    const {pathname} = action.payload
    const roomId = pathname.slice(1)
    const user = yield select(s => s.user)
    const id = user.id || v4()
    sessionStorage.setItem('_id', id)

    if (user.type === 'guest') {
      yield put({type: 'NEW_GAME'})
    } else {
      yield put({type: 'LOAD_GAME'})
    }

    yield fork(createPeer, [id, sendToPeers])
    yield delay(500)

    if (pathname !== '/' && user.type === 'guest') {
      yield put(
        sendToPeers, {
          to: roomId,
          action: {type: 'REQUEST_ROOM', payload: {userId: id}}})
    }

    yield call(maybeNextRound(sendToPeers))
    // yield* connectToWebsocket()
  } catch (e) {
    yield put({type: 'INITIALIZE_FAILURE', payload: e})
  }
}

const requestRoom = sendToPeers => function* (action) {
  const {userId} = action.payload
  const table = yield select(state => state.game.table)
  yield put(
    sendToPeers,
    {to: userId, action: {type: 'REQUEST_ROOM_SUCCESS', payload: {table}}})
}

const sitUser = sendToPeers => function* ({payload}) {
  try {
    const {pathname} = payload
    const roomId = pathname.slice(1)
    const uid = sessionStorage.getItem('_id')
    const user = {
      type: 'player',
      id: uid || v4(),
      stack: 100,
      username: payload.username,
    }

    sessionStorage.removeItem('_id')

    const action = {type: 'SIT_USER_SUCCESS', payload: {user}}
    yield put(action)

    if (pathname !== '/') {
      yield put(sendToPeers, {to: roomId, action})
    }
  } catch (e) {
    console.log(e)
    yield put({type: 'SIT_USER_FAILURE', payload: {message: e.message}})
  }
}

const broadcast = sendToPeers => function* (action) {
  const peers = yield select(state => state.game.table.players)
  yield all(peers.map(({id}) => put(sendToPeers, {to: id, action})))
}

const maybeNextRound = sendToPeers => function* (action) {
  const user = yield select(state => state.user)
  const round = yield select(state => state.game.round)
  const table = yield select(state => state.game.table)
  const roundFinished = safe(false)(() => round.status === 'FINISHED')
  const enoughPlayers = table.players.length > 1

  if (roundFinished && enoughPlayers) {
    const button = isNaN(round.button)? 0 : (round.button + 1) % round.players.length
    const userOnButton = user.id === table.players[button].id

    if (userOnButton) {
      const seed = v4()
      yield call(broadcast(sendToPeers), {type: 'NEXT_ROUND', payload: {seed}})
    }
  }
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

const fold = sendToPeers => function* (action) {
  yield call(broadcast(sendToPeers), {type: 'FOLD'})
  yield delay(500)
  yield put({type: 'FOLD_SUCCESS'})
}

const foldSuccess = sendToPeers => function* (action) {
  yield call(maybeEndRound(sendToPeers), action)
}

const maybeEndRound = sendToPeers => function* (action) {
  const round = yield select(state => state.game.round)
  const isShowdown = round.street === STREETS[4]
  const allIn = round.status === ROUND_STATUS[2]
  const isRiver = round.street === STREETS[3]
  const streetFinished = round.streetStatus === STREET_STATUS[1]
  const canEndRound =
    round.players.length === 1 || isShowdown || (allIn && isRiver && streetFinished)

  if (canEndRound) {
    yield call(broadcast(sendToPeers), {type: 'GET_WINNERS'})
    yield delay(3000)
    yield call(broadcast(sendToPeers), {type: 'END_ROUND'})
    yield call(broadcast(sendToPeers), {type: 'END_ROUND_SUCCESS'})
  }
}

const maybeDeal = sendToPeers => function* (action) {
  const round = yield select(state => state.game.round)
  const isShowdown = round.street === STREETS[4]
  const allIn = round.status === ROUND_STATUS[2]
  const streetFinished = round.streetStatus === STREET_STATUS[1]

  if (!isShowdown) {
    if (streetFinished || allIn) {
      yield call(broadcast(sendToPeers), {type: 'DEAL'})
    }

    if (allIn) {
      yield call(maybeEndRound(sendToPeers))
      yield delay(500)
      yield call(maybeDeal(sendToPeers))
    }
  }
}

const bet = sendToPeers => function* ({payload}) {
  yield call(broadcast(sendToPeers), {type: 'BET', payload})
  yield delay(100)
  yield put({type: 'BET_SUCCESS'})
}

const betSuccess = sendToPeers => function* (action) {
  yield call(maybeDeal(sendToPeers))
  yield call(maybeEndRound(sendToPeers))
}

const showdownSuccess = socket => function* (action) {
  const round = yield select(state => state.game.round)

  yield delay(3000)
  yield put({type: 'END_ROUND', payload: {winners: round.winners}})
}

const playerTimeout = socket => function* (action) {
  const {playerId, timeoutLength} = action.payload
  let run = true

  while (run) {
    yield race({
      task: call(update),
      cancel: take('PLAYER_TIMEOUT_OFF')
    })


    yield put({type: 'UPDATE_PLAYER_TIMEOUT', payload: {playerId, value: 0}})
    run = false
  }

  function* update() {
    for (let i = timeoutLength / 1000; i > 0; i = i - 1) {
      yield put({type: 'UPDATE_PLAYER_TIMEOUT', payload: {playerId, value: i}})
      yield delay(1000)
    }
  }
}

function* subscribeToHttp() {
  const sendToPeers = yield call(channel)

  yield takeEvery('INITIALIZE', getInitialState(sendToPeers))
  yield takeEvery('SIT_USER', sitUser(sendToPeers))
  yield takeEvery('REQUEST_ROOM', requestRoom(sendToPeers))
  yield takeEvery('SIT_USER_SUCCESS', maybeNextRound(sendToPeers))
  yield takeEvery('END_ROUND_SUCCESS', maybeNextRound(sendToPeers))
  yield takeEvery('ATTEMPT_FOLD', fold(sendToPeers))
  yield takeEvery('FOLD_SUCCESS', foldSuccess(sendToPeers))
  yield takeEvery('ATTEMPT_BET', bet(sendToPeers))
  yield takeEvery('BET_SUCCESS', betSuccess(sendToPeers))
}

function* subscribe(socket) {
  yield takeEvery('NEXT_ROUND_SUCCESS', nextRoundSuccess(socket))
  yield takeEvery('POST_BLINDS', postBlinds(socket))
  yield takeEvery('POST_BLINDS_SUCCESS', postBlindsSuccess(socket))
  yield takeEvery('DEAL_CARDS', dealCards(socket))
  // yield takeEvery('END_ROUND', endRound(socket))
  yield takeEvery('SHOWDOWN_SUCCESS', showdownSuccess(socket))
  yield takeEvery('PLAYER_TIMEOUT_ON', playerTimeout(socket))
  // yield takeEvery('PLAYER_TIMEOUT_OFF', function* () {yield cancel(playerTimeout)})
}

// function* initialize() {
//   const maybeUser = yield call(sessionStorage.getItem.bind(sessionStorage), 'currentUser')
//   yield put({type: 'INITIALIZE', payload: {maybeUser}})
// }

function* mainSaga() {
  yield* subscribeToHttp()
  // yield* initialize()
}

export {subscribe}
export default mainSaga
