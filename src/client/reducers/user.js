import {createReducer} from '@reduxjs/toolkit'

const defaultState = {type: 'guest'}
const userReducer = createReducer(defaultState, {
  SIT_USER_SUCCESS: (s, {payload: {user}}) => {
    if (s.type !== 'guest') {return s}
    return user
  },
})

export default userReducer
