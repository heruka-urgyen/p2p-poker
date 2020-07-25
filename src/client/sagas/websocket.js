import {
  all,
  apply,
  call,
  cancel,
  cancelled,
  delay,
  flush,
  fork,
  put,
  select,
  take,
} from 'redux-saga/effects'
import {END, eventChannel} from 'redux-saga'
import Peer from 'peerjs'

import {safe} from 'client/util'

const P2PSERVER = {host: 'localhost', port: '9000', path: '/poker', debug: 2}
const peers = {}
const TURN_LENGTH = 30

let turnTimerTask
let sendToPeersTask

function createP2PChannel(peer) {
  const handleError = emit => () => {
    emit({type: 'PEER_DISCONNECTED', payload: {message: 'Peer disconnected'}})
  }

  const handleConnection = emit => connection => {
    connection.on('data', data => {
      emit(data)
    })
  }

  return eventChannel(emit => {
    peer.on('error', handleError(emit))
    peer.on('connection', handleConnection(emit))

    return () => {
      peer.off('error', handleError(emit))
      peer.off('connection', handleConnection(emit))
    }
  })
}

function connectionOnOpen(connection) {
  const handleConnectionOpen = emit => () => {
    emit(connection)
  }

  return eventChannel(emit => {
    connection.on('open', handleConnectionOpen(emit))

    return () => {
      connection.off('open', handleConnectionOpen(emit))
    }
  })
}

function countdown(seconds) {
  let s = seconds

  return eventChannel(emit => {
    const timer = setInterval(() => {
      s = s - 1
      s >= 0? emit(s) : emit(END)
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  })
}

function* timer([sendToPeers, id, length]) {
  const ch = yield call(countdown, length)
  const table = yield select(s => s.game.table)
  const {players, nextPlayer} = yield select(s => s.game.round)
  const username = safe('')(() => table.players.find(p => p.id === nextPlayer).username)

  function* broadcastTimer(seconds) {
    yield put({type: 'UPDATE_TURN_TIMER', payload: {username, seconds}})
    yield all(players.filter(pid => pid !== id).map(id => put(
      sendToPeers,
      {
        to: id,
        action: {type: 'UPDATE_TURN_TIMER', payload: {username, seconds}}
      })))
  }

  try {
    while (true) {
      let seconds = yield take(ch)
      yield call(broadcastTimer, seconds)

      if (seconds === 0) {
        yield put({type: 'ATTEMPT_FOLD'})
      }
    }
  } catch (e) {
    console.error('timer error', e)
  } finally {
    yield put({type: 'UPDATE_TURN_TIMER', payload: {username, seconds: 0}})
    if (yield cancelled()) {
      ch.close()
    }
  }
}

function* connectP2P([peer, sendToPeers]) {
  while (true) {
    try {
      const {to, action} = yield take(sendToPeers)

      if (peer._id === to) {
        yield put(action)
      } else {
        if (safe(false)(() => peer.connections[to].length > 2)) {
          peer.connections[to][0].close()
        }

        const connection = yield apply(peer, peer.connect, [to])
        const c = yield take(yield call(connectionOnOpen, connection))

        yield apply(c, c.send, [action])
      }

      if (action.type !== 'UPDATE_TURN_TIMER' && turnTimerTask) {
        yield cancel(turnTimerTask)
      }

      const startTimer = action.type === 'NEXT_ROUND'
        || action.type === 'DEAL'
        || action.type === 'BET'
        || action.type === 'FOLD'

      if (startTimer) {
        turnTimerTask = yield fork(timer, [sendToPeers, peer._id, TURN_LENGTH])
      }
    } catch(err) {
      console.error('p2p error:', err)
    }
  }
}

export function* createPeer([id, sendToPeers]) {
  const peer = yield call(() => new Peer(id, P2PSERVER))
  peers[id] = peer
  const p2pChannel = yield call(createP2PChannel, peer)

  if (sendToPeersTask) {
    yield cancel(sendToPeersTask)
  }

  sendToPeersTask = yield fork(connectP2P, [peer, sendToPeers])

  yield call(() =>
    Object.keys(peers).filter(pid => pid !== id).forEach(pid => {peers[pid].destroy()}))

  while (true) {
    try {
      const action = yield take(p2pChannel)

      if (action.type === 'PEER_DISCONNECTED') {
        yield delay(1000)
        yield flush(sendToPeers)
        yield cancel(sendToPeersTask)
        sendToPeersTask = yield fork(connectP2P, [peer, sendToPeers])
      }

      if (action.type !== 'UPDATE_TURN_TIMER' && turnTimerTask) {
        yield cancel(turnTimerTask)
      }

      yield put(action)
    } catch(err) {
      console.error('p2p error:', err)
    } finally {
      if (yield cancelled()) {
        p2pChannel.close()
      }
    }
  }
}
