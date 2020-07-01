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
  DEAL_CARDS_SUCCESS: (players, {payload: {cards}}) => {
    cards.forEach(c => {
      players[c.userId].cards = c.cards
    })
  },
})

export default playersReducer
