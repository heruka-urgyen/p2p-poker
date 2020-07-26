import {createReducer} from '@reduxjs/toolkit'

const defaultState = {
  loading: true,
  error: {message: ''},
}
const uiReducer = createReducer(defaultState, {
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
