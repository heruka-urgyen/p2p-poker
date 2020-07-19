import {createReducer} from '@reduxjs/toolkit'

const defaultState = {type: 'guest'}
const userReducer = createReducer(defaultState, {
  INITIALIZE_SUCCESS: (state, {payload: {user}}) => {
    return user || state
  },
  SIT_USER_SUCCESS: (_, {payload: {user}}) => {
    return user
  },
  END_ROUND_SUCCESS: (_, {payload: {user}}) => {
    return user
  },
})

export default userReducer
