import {createReducer} from '@reduxjs/toolkit'

const roundReducer = createReducer(null, {
  GET_ROUND_SUCCESS: (_, {payload: {round}}) => {
    return round
  },
})

export default roundReducer
