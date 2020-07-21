import {createReducer, createAction} from '@reduxjs/toolkit'

const defaultState = {
  user: {type: 'guest'},
  table: {
    id: 1,
    maxPlayers: 2,
    players: [],
  },
  round: {
    status: 'FINISHED',
    id: 0,
  },
}

const gameReducer = createReducer(defaultState, {
  INITIALIZE_SUCCESS: (game, {payload: {round, table, user}}) => {
    if (round) {
      game.round = round
    }

    if (table) {
      game.table = table
    }

    if (user) {
      game.user = user
    }
  },
  REQUEST_ROOM_SUCCESS: (game, {payload: {table}}) => {
    game.table = table
  },
  SIT_USER_SUCCESS: (game, {payload: {user}}) => {
    game.table.players.push(user)
    game.user = user
  },
  PEER_JOINED_SUCCESS: (game, {payload: {table}}) => {
    game.table = table
  },
})

export const sitUser = createAction('SIT_USER')
export const fold = createAction('FOLD')
export const bet = createAction('BET')

export default gameReducer
