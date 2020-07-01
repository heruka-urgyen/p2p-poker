import {createReducer, createAction} from '@reduxjs/toolkit'

const tableReducer = createReducer(null, {
  GET_TABLE_SUCCESS: (_, {payload: {table}}) => {
    return table
  },
  UPDATE_TABLE_PLAYERS: (_, {payload: {table}}) => {
    return table
  },
})

export const sitUser = createAction('SIT_USER')
export default tableReducer
