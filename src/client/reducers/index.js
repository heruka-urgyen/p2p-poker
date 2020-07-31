import {combineReducers} from 'redux'
import {persistReducer} from 'redux-persist'
import storage from 'redux-persist/lib/storage/session'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'

import game from './game'
import user from './user'
import ui from './ui'

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  stateReconciler: autoMergeLevel2,
  blacklist: ['ui'],
}

const uiPersistConfig = {
  key: 'ui',
  version: 1,
  storage,
  stateReconciler: autoMergeLevel2,
  blacklist: ['error'],
}

const reducer = combineReducers({
  ui: persistReducer(uiPersistConfig, ui),
  user,
  game,
})

export default persistReducer(persistConfig, reducer)
