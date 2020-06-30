import {createReducer} from '@reduxjs/toolkit'

const tableReducer = createReducer(null, {
  GET_TABLE_SUCCESS: (_, {payload: {table}}) => {
    return table
  },
})

export default tableReducer
