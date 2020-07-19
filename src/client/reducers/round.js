import {createReducer, createAction} from '@reduxjs/toolkit'

const defaultState = {
  id: 0,
  status: 'FINISHED',
}
const roundReducer = createReducer(defaultState, {
  INITIALIZE_SUCCESS: (state, {payload: {round}}) => {
    return round || state
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
