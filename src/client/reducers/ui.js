import {createReducer} from '@reduxjs/toolkit'

const defaultState = {
  roomId: undefined,
  loading: true,
  error: {message: ''},
}
const uiReducer = createReducer(defaultState, {
  INITIALIZE: s => {
    return {...s, error: defaultState.error}
  },
  ROOM_LOADING: (s, {payload: {roomId}}) => {
    return {...s, roomId, loading: true}
  },
  ROOM_LOADED: (s, {payload: {roomId}}) => {
    return {...s, roomId, loading: false}
  },
  PEER_DISCONNECTED: (s, {payload: {message}}) => {
    return {...s, error: {message}}
  },
  CLEAR_ERROR: s => {
    return {...s, error: {message: ''}}
  },
})

export default uiReducer
