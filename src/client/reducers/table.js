import {createReducer, createAction} from '@reduxjs/toolkit'

const tableReducer = createReducer(null, {
  INITIALIZE_SUCCESS: (_, {payload: {table}}) => {
    return table
  },
  UPDATE_TABLE_PLAYERS: (_, {payload: {table}}) => {
    return table
  },
  POST_BLINDS_SUCCESS: (table, {payload: {players}}) => {
    table.players = players
  },
  DEAL_CARDS_SUCCESS: (table, {payload: {players}}) => {
    table.players = players
  },
  FOLD_SUCCESS: (table, {payload: {players}}) => {
    table.players = players
  },
  BET_SUCCESS: (table, {payload: {updatedStack: {playerId, stack}}}) => {
    table.players.find(p => p.id === playerId).stack = stack
  },
  END_ROUND_SUCCESS: (_, {payload: {table}}) => {
    return table
  },
})

export const sitUser = createAction('SIT_USER')
export default tableReducer
