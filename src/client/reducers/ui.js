import {createReducer} from '@reduxjs/toolkit'

const defaultState = {
  loading: true,
  error: {message: ''},
  timer: {username: '', seconds: 0, active: false},
}
const uiReducer = createReducer(defaultState, {
  UPDATE_TURN_TIMER: (s, {payload: {username, seconds}}) => {
    const active = seconds > 0
    return {...s, timer: {username, seconds, active}}
  },
 ROOM_LOADING: (s) => {
    return {...s, loading: true}
  },
  ROOM_LOADED: (s) => {
    return {...s, loading: false}
  },
  PEER_DISCONNECTED: (s, {payload: {message}}) => {
    return {...s, error: {message}}
  },
  CLEAR_ERROR: s => {
    return {...s, error: {message: ''}}
  },
})

export default uiReducer
