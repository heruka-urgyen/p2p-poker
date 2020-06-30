import {all, apply, put, takeEvery} from 'redux-saga/effects'

import {connectToWebsocket} from './websocket'

const getUser = socket => function* (action) {
  yield apply(socket, socket.emit, ['GET_USER'])
}

function* subscribe(socket) {
  yield takeEvery('GET_USER', getUser(socket))
}

function* initialize() {
  yield put({type: 'GET_USER'})
}

function* mainSaga() {
  yield all([
    connectToWebsocket(),
    initialize(),
  ])
}

export {subscribe}
export default mainSaga
