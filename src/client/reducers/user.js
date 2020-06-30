import {createReducer} from '@reduxjs/toolkit'

const userReducer = createReducer(null, {
  GET_USER_SUCCESS: (state, {payload: {user}}) => {
    return user
  },
  SIT_USER_SUCCESS: (state, {payload: {user}}) => {
    return user
  },
})

export default userReducer
