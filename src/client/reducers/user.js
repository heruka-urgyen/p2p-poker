import {createReducer} from '@reduxjs/toolkit'

const userReducer = createReducer(null, {
  INITIALIZE_SUCCESS: (_, {payload: {user}}) => {
    return user
  },
  SIT_USER_SUCCESS: (_, {payload: {user}}) => {
    return user
  },
  END_ROUND_SUCCESS: (_, {payload: {user}}) => {
    return user
  },
})

export default userReducer
