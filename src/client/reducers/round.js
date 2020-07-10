import {createReducer, createAction} from '@reduxjs/toolkit'

const roundReducer = createReducer(null, {
  INITIALIZE_SUCCESS: (_, {payload: {round}}) => {
    return round
  },
  NEXT_ROUND_SUCCESS: (_, {payload: {round}}) => {
    return round
  },
  POST_BLINDS_SUCCESS: (_, {payload: {round}}) => {
    return round
  },
  FOLD_SUCCESS: (_, {payload: {round}}) => {
    return round
  },
  END_ROUND_SUCCESS: (_, {payload: {round}}) => {
    return round
  },
  BET_SUCCESS: (_, {payload: {round}}) => {
    return round
  },
  DEAL_CARDS_SUCCESS: (_, {payload: {round}}) => {
    return round
  },
  SHOWDOWN_SUCCESS: (_, {payload: {round}}) => {
    return round
  },
})

export const fold = createAction('FOLD')
export const bet = createAction('BET')
export default roundReducer
