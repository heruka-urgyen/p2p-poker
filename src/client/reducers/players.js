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
  DEAL_CARDS_SUCCESS: (_, {payload: {players}}) => {
    return players
  },
  FOLD_SUCCESS: (_, {payload: {players}}) => {
    return players
  },
  END_ROUND_SUCCESS: (_, {payload: {players}}) => {
    return players
  },
})

export default playersReducer
