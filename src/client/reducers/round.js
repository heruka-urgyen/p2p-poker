import {createReducer} from '@reduxjs/toolkit'

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
})

export default roundReducer
