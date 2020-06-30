import {combineReducers} from 'redux'

import user from './user'
import table from './table'
import players from './players'

export default combineReducers({user, table, players})
