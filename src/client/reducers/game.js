import {createReducer, createAction} from '@reduxjs/toolkit'
import {newGame, loadGame, seededDeck, ROUND_STATUS} from '@heruka_urgyen/poker-solver'

const toObject = o => JSON.parse(JSON.stringify(o))

const defaultTable = {
  id: "1",
  maxPlayers: 2,
  players: [],
}

let _game
const update = (...fs) => {
  _game = fs.reduce((s, f) => s.update(f), _game)
  return toObject(_game.get())
}

const defaultState = {
  table: defaultTable,
}

const gameReducer = createReducer(defaultState, {
  NEW_GAME: (_) => {
    _game = newGame(defaultTable)
    return _game.get()
  },
  LOAD_GAME: (s) => {
    _game = loadGame(toObject(s))
    return s
  },
  LEAVE_GAME: (s, {payload: {id}}) => {
    return update(actions => actions.leave(id))
  },
  REQUEST_ROOM_SUCCESS: (_, {payload: {table: {players}}}) => {
    return players.reduce((f, p) => f(p), p => update(actions => actions.sitPlayer(p)))
  },
  SIT_USER_SUCCESS: (_, {payload: {user}}) => {
    return update(actions => actions.sitPlayer(user))
  },
  NEXT_ROUND: (_, {payload: {seed}}) => {
    return update(
      actions => actions.newRound(seededDeck(seed)),
      actions => actions.postBlinds,
      actions => actions.deal,
    )
  },
  DEAL: (_) => {
    return update(actions => actions.deal)
  },
  FOLD: (_) => {
    return update(actions => actions.fold)
  },
  BET: (_, {payload: {amount}}) => {
    return update(actions => actions.bet(amount))
  },
  GET_WINNERS: (s) => {
    if (s.round.winners.length > 0) {
      return s
    }
    return update(actions => actions.getWinners)
  },
  END_ROUND: (s) => {
    if (s.round.status === ROUND_STATUS[1]) {
      return s
    }
    return update(actions => actions.endRound)
  },
})

export const sitUser = createAction('SIT_USER')
export const fold = createAction('ATTEMPT_FOLD')
export const bet = createAction('ATTEMPT_BET')

export default gameReducer
