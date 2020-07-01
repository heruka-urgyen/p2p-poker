import {createReducer} from '@reduxjs/toolkit'

const playersReducer = createReducer(null, {
  INITIALIZE_SUCCESS: (_, {payload: {players}}) => {
    return players
  },
  UPDATE_TABLE_PLAYERS: (_, {payload: {players}}) => {
    return players
  },
  POST_BLINDS_SUCCESS: (_, {payload: {players}}) => {
    return players
  },
})

export default playersReducer
