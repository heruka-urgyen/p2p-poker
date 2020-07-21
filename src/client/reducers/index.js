import {combineReducers} from 'redux'

import game from './game'
import user from './user'
// import table from './table'
// import round from './round'

export default combineReducers({user, game})
