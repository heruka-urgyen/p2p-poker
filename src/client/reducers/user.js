import {createReducer} from '@reduxjs/toolkit'

const defaultState = {type: 'guest'}
const userReducer = createReducer(defaultState, {
  SIT_USER_SUCCESS: (s, {payload: {user}}) => {
    if (s.type !== 'guest') {return s}
    return user
  },
  END_ROUND_SUCCESS: (s, {payload: {players}}) => {
    if (!players.find(p => p.id === s.id)) {
      return defaultState
    }
    return s
  },
})

export default userReducer
