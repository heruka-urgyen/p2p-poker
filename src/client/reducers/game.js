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
  table: defaltTable,
}

const toObject = o => JSON.parse(JSON.stringify(o))

const gameReducer = createReducer(defaultState, {
  NEW_GAME: (_) => {
    return _game.get()
  },
  REQUEST_ROOM_SUCCESS: (_, {payload: {table: {players}}}) => {
    return players.reduce((f, p) => f(p), p => update(actions => actions.sitPlayer(p)))
  },
  SIT_USER_SUCCESS: (_, {payload: {user}}) => {
    return update(actions => actions.sitPlayer(user))
  },
})

export const sitUser = createAction('SIT_USER')
export const fold = createAction('FOLD')
export const bet = createAction('BET')

export default gameReducer
