import {createReducer} from '@reduxjs/toolkit'

const playersReducer = createReducer(null, {
  UPDATE_TABLE_SUCCESS: (state, {payload: {players}}) => {
    return players
  },
})

export default playersReducer
