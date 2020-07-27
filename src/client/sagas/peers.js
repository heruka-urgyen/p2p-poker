import {
  apply,
  call,
  cancel,
  cancelled,
  delay,
  fork,
  put,
  race,
  take,
} from 'redux-saga/effects'
import {eventChannel} from 'redux-saga'
import Peer from 'peerjs'

import {safe} from 'client/util'
import {p2pServerConfig} from 'config'

const peers = {}

let sendToPeersTask
let dataTask
let dataChannelTask

const emitter = emit => c => {emit(c)}

function connectPeer(peer) {
  const handleError = emit => e => {
    if (e.type === 'peer-unavailable') {
      const id = e.message.match(/(\S+)$/)[0]
      emit({type: 'PEER_DISCONNECTED', payload: {message: 'Peer disconnected', id}})
    }
  }

  return eventChannel(emit => {
    peer.on('connection', emitter(emit))
    peer.on('error', handleError(emit))

    return () => {
      peer.off('connection', emitter(emit))
      peer.off('error', handleError(emit))
    }
  })
}

function connectionOnData(connection) {
  const handleDisconnect = emit => () => {
    emit({
      type: 'PEER_DISCONNECTED',
      payload: {message: 'Peer disconnected', id: connection.peer}})
  }

  return eventChannel(emit => {
    connection.on('data', emitter(emit))
    connection.on('close', handleDisconnect(emit))

    return () => {
      connection.off('data', emitter(emit))
      connection.off('close', handleDisconnect(emit))
    }
  })
}

function connectionOnOpen(connection) {
  return eventChannel(emit => {
    connection.on('open', () => emitter(emit)(connection))

    return () => {
      connection.off('open', () => emitter(emit)(connection))
    }
  })
}

function* connectToDataChannel(c) {
  const ch = yield call(connectionOnData, c)

  while (true) {
    try {
      const action = yield take(ch)

      if (action.type === 'PEER_DISCONNECTED') {
        yield put(action)
        c.close()
        ch.close()
      }

      if (action.type !== 'PEER_DISCONNECTED') {
        yield put(action)
      }
    } catch (e) {} finally {
      if (yield cancelled()) {
        ch.close()
      }
    }
  }
}

function* connectToPeer([peer, to]) {
  const connection = yield apply(peer, peer.connect, [to])
  const ch = yield call(connectionOnOpen, connection)
  const {c} = yield race({
    c: take(ch),
    timeout: delay(500),
  })

  if (!c || !c.open) {
    try {
      ch.close()
    } catch(e) {} finally {
      return yield call(connectToPeer, [peer, to])
    }
  } else {
    return c
  }
}

function* connectP2P([peer, sendToPeers]) {
  let c
  while (true) {
    try {
      const {to, action} = yield take(sendToPeers)

      if (peer._id === to) {
        yield put(action)
      } else {
        const maybeC = safe({open: false})(() => peer.connections[to][0])
        if (maybeC.open) {
          c = maybeC
        } else {
          if (dataTask) {
            cancel(dataTask)
          }

          c = yield call(connectToPeer, [peer, to])
          dataTask = yield fork(connectToDataChannel, c)
        }

        yield apply(c, c.send, [action])
      }
    } catch(err) {
      console.error('p2p error:', err)
    }
  }
}

export function* createPeer([id, sendToPeers]) {
  const peer = yield call(() => new Peer(id, p2pServerConfig))
  peers[id] = peer

  if (sendToPeersTask) {
    yield cancel(sendToPeersTask)
  }

  sendToPeersTask = yield fork(connectP2P, [peer, sendToPeers])

  yield call(() => Object.keys(peers).forEach(pid => {
    if (pid !== id) {
      peers[pid].destroy()
    }
  }))

  const ch = yield call(connectPeer, peer)

  while (true) {
    try {
      const closedConnection = yield take(ch)
      const connectionCh = yield call(connectionOnOpen, closedConnection)
      const connection = yield take(connectionCh)

      if (dataChannelTask) {
        yield cancel(dataChannelTask)
      }

      dataChannelTask = yield fork(connectToDataChannel, connection)
    } finally {
      if (yield cancelled()) {
        ch.close()
      }
    }
  }
}

function beforeUnload(w) {
  const handler = emit => () => {
    emit(1)
  }

  return eventChannel(emit => {
    w.addEventListener('beforeunload', handler(emit))

    return () => {
      w.removeEventListener('beforeunload', handler(emit))
    }
  })
}

export function* windowClosed([roomId, id, sendToPeers]) {
  const ch = yield call(beforeUnload, window)

  while (true) {
    yield take(ch)
    yield put(sendToPeers, {
      to: roomId,
      action: {type: 'PEER_DISCONNECTED', payload: {message: 'Peer disconnected', id}}})
  }
}

