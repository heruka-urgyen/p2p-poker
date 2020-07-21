import {createReducer} from '@reduxjs/toolkit'

const defaultState = {type: 'guest'}
const userReducer = createReducer(defaultState, {
  SIT_USER_SUCCESS: (_, {payload: {user}}) => {
    return user
  },
})

export default userReducer
