import {createReducer, createAction} from '@reduxjs/toolkit'
import {newGame} from '@heruka_urgyen/poker-solver'

const defaltTable = {
  id: "1",
  maxPlayers: 2,
  players: [],
}

let _game = newGame(defaltTable)
const update = f => {
  _game = _game.update(f)
  return _game.get()
}

const defaultState = {
  user: {type: 'guest'},
  table: defaltTable,
}

const toObject = o => JSON.parse(JSON.stringify(o))

const gameReducer = createReducer(defaultState, {
  NEW_GAME: (s, _) => {
    const {table, round} = _game.get()
    s.table = table
    s.round = round
  },
  REQUEST_ROOM_SUCCESS: (s, {payload: {table}}) => {
    s.table = table
  },
  SIT_USER_SUCCESS: (s, {payload: {user}}) => {
    const {table, round} = update(actions => actions.sitPlayer(user))

    s.table = table
    s.round = round
    s.user = user
  },
  PEER_JOINED_SUCCESS: (s, {payload: {table}}) => {
    s.table = table
  },
})

export const sitUser = createAction('SIT_USER')
export const fold = createAction('FOLD')
export const bet = createAction('BET')

export default gameReducer
