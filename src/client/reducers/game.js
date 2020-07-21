import {createReducer, createAction} from '@reduxjs/toolkit'
import {newGame, seededDeck} from '@heruka_urgyen/poker-solver'

const toObject = o => JSON.parse(JSON.stringify(o))

const defaltTable = {
  id: "1",
  maxPlayers: 2,
  players: [],
}

let _game = newGame(defaltTable)
const update = f => {
  _game = _game.update(f)
  return toObject(_game.get())
}

const defaultState = {
  table: defaltTable,
}

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
  NEXT_ROUND: (_, {payload: {seed}}) => {
    return update(actions => actions.newRound(seededDeck(seed)))
  },
})

export const sitUser = createAction('SIT_USER')
export const fold = createAction('FOLD')
export const bet = createAction('BET')

export default gameReducer
