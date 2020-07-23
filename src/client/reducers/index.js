import {combineReducers} from 'redux'

import game from './game'
import user from './user'
import ui from './ui'

export default combineReducers({user, ui, game})
