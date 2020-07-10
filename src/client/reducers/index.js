import {combineReducers} from 'redux'

import user from './user'
import table from './table'
import round from './round'

export default combineReducers({user, table, round})
