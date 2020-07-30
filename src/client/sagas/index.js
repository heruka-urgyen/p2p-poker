import {channel} from 'redux-saga'
import {
  cancel,
  all,
  call,
  delay,
  fork,
  put,
  race,
  select,
  take,
  takeEvery,
} from 'redux-saga/effects'
import {ROUND_STATUS, STREETS, STREET_STATUS} from '@heruka_urgyen/poker-solver'
import {v4} from 'uuid'

import {createPeer, windowClosed} from './peers'
import {safe} from 'client/util'
import history from 'client/history'

let peerTask
let closeWindowTask

const broadcast = sendToPeers => function* (action) {
  const peers = yield select(state => state.game.table.players)
  yield all(peers.map(({id}) => put(sendToPeers, {to: id, action})))
}

const getInitialState = sendToPeers => function* () {
  try {
    const {pathname} = history.location
    const user = yield select(s => s.user)
    const id = user.id || v4()
    const roomId = pathname.slice(1) || id
    sessionStorage.setItem('_id', id)

    yield put({type: 'ROOM_LOADING', payload: {roomId}})

    if (user.type === 'guest') {
      yield put({type: 'NEW_GAME'})
    } else {
      yield put({type: 'LOAD_GAME'})
    }

    if (peerTask) {
      cancel(peerTask)
    }

    if (closeWindowTask) {
      cancel(closeWindowTask)
    }

    peerTask = yield fork(createPeer, [id, sendToPeers])
    closeWindowTask = yield fork(windowClosed, [roomId, id, sendToPeers])


    if (pathname === '/') {
      yield put({type: 'ROOM_LOADED', payload: {roomId}})
    }

    if (pathname !== '/' && user.type === 'guest') {
      yield call(function* retryRequestRoom() {
        yield put(
          sendToPeers, {
            to: roomId,
            action: {type: 'REQUEST_ROOM', payload: {userId: id}}})

        const {task, retry} = yield race({
          task: take('REQUEST_ROOM_SUCCESS'),
          retry: delay(1000),
        })

        if (retry) {
          yield call(retryRequestRoom)
        }

        if (task) {
          yield put({type: 'ROOM_LOADED', payload: {roomId}})
        }
      })
    }

    yield call(maybeNextRound(sendToPeers))
  } catch (e) {
    yield put({type: 'INITIALIZE_FAILURE', payload: e})
  }
}

const requestRoom = sendToPeers => function* (action) {
  const {userId} = action.payload
  const game = yield select(state => state.game)

  if (game.round.status !== ROUND_STATUS[1]) {
    yield delay(500)
    yield call(requestRoom(sendToPeers), action)
  } else {
    yield put(
      sendToPeers,
      {to: userId, action: {type: 'REQUEST_ROOM_SUCCESS', payload: {game}}})
  }
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

const sitUserSuccess = sendToPeers => function* ({payload: {user}}) {
  yield call(maybeNextRound(sendToPeers))
}

const maybeNextRound = sendToPeers => function* (action) {
  yield delay(500)
  const user = yield select(state => state.user)
  const round = yield select(state => state.game.round)
  const table = yield select(state => state.game.table)
  const roundFinished = safe(false)(() => round.status === 'FINISHED')
  const enoughPlayers = table.players.length > 1
  if (roundFinished && enoughPlayers) {
    const button = isNaN(round.button)? 0 : (round.button + 1) % round.players.length
    const userOnButton = user.id === table.players[button].id

    if (userOnButton) {
      const id = v4()
      const seed = v4()
      yield call(broadcast(sendToPeers), {type: 'NEXT_ROUND', payload: {id, seed}})
    }
  }
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
  const table = yield select(state => state.game.table)
  const round = yield select(state => state.game.round)
  const isShowdown = round.street === STREETS[4]
  const allIn = round.status === ROUND_STATUS[2]
  const isRiver = round.street === STREETS[3]
  const streetFinished = round.streetStatus === STREET_STATUS[1]
  const canEndRound = round.status !== ROUND_STATUS[1]
    && (round.players.length === 1
    || isShowdown
    || (allIn && isRiver && streetFinished))

  if (canEndRound) {
    if (table.players.length === 1) {
      yield put({type: 'GET_WINNERS'})
      yield put({type: 'END_ROUND'})
    } else {
      yield call(broadcast(sendToPeers), {type: 'GET_WINNERS'})
      if (isShowdown || (isRiver && round.streetStatus)) {
        yield delay(2500)
      }
      yield call(broadcast(sendToPeers), {type: 'END_ROUND'})
    }
  }
}

const endRound = sendToPeers => function* (action) {
  const players = yield select(s => s.game.table.players)
  yield put({type: 'END_ROUND_SUCCESS', payload: {players}})

  if (players.length === 1) {
    if (history.location.pathname.slice(1) !== players[0].id) {
      yield put({type: 'ROOM_LOADED', payload: {roomId: players[0].id}})
      yield call(() => history.replace(`/${players[0].id}`))
    }

    const user = yield select(s => s.user)

    if (user.type === 'guest') {
      yield call(() => history.push('/'))
      yield put({type: 'INITIALIZE'})
    }
  }
}

const maybeDeal = sendToPeers => function* (action) {
  const round = yield select(state => state.game.round)
  const streetFinished = round.streetStatus === STREET_STATUS[1]
  const isShowdown = round.street === STREETS[4]
    || (round.street === STREETS[3] && streetFinished)
  const allIn = round.status === ROUND_STATUS[2]

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
  yield delay(500)
  yield put({type: 'BET_SUCCESS'})
}

const betSuccess = sendToPeers => function* (action) {
  yield call(maybeDeal(sendToPeers))
  yield call(maybeEndRound(sendToPeers))
}

const peerDisconnected = sendToPeers => function* ({payload: {id}}) {
  const players = yield select(s => safe([])(() => s.game.round.players))

  if (players.find(pid => pid === id)) {
    yield put({type: 'LEAVE_GAME', payload: {id}})
  }

  yield delay(1000)
  yield put({type: 'CLEAR_ERROR'})
}

const leaveGame = sendToPeers => function* ({payload: {id}}) {
  yield call(broadcast(sendToPeers), {type: 'LEAVE_GAME', payload: {id}})
}

const leaveGameSuccess = sendToPeers => function* ({payload: {id}}) {
  yield call(maybeEndRound(sendToPeers))
}

function* subscribe() {
  const sendToPeers = yield call(channel)

  yield takeEvery('INITIALIZE', getInitialState(sendToPeers))
  yield takeEvery('SIT_USER', sitUser(sendToPeers))
  yield takeEvery('REQUEST_ROOM', requestRoom(sendToPeers))
  yield takeEvery('SIT_USER_SUCCESS', sitUserSuccess(sendToPeers))
  yield takeEvery('END_ROUND_SUCCESS', maybeNextRound(sendToPeers))
  yield takeEvery('ATTEMPT_FOLD', fold(sendToPeers))
  yield takeEvery('FOLD_SUCCESS', foldSuccess(sendToPeers))
  yield takeEvery('ATTEMPT_BET', bet(sendToPeers))
  yield takeEvery('BET_SUCCESS', betSuccess(sendToPeers))
  yield takeEvery('END_ROUND', endRound(sendToPeers))
  yield takeEvery('PEER_DISCONNECTED', peerDisconnected(sendToPeers))
  yield takeEvery('ATTEMPT_LEAVE_GAME', leaveGame(sendToPeers))
  yield takeEvery('LEAVE_GAME', leaveGameSuccess(sendToPeers))
}

function* mainSaga() {
  yield* subscribe()
  yield delay(100)
  yield put({type: 'INITIALIZE'})
}

export {subscribe}
export default mainSaga
