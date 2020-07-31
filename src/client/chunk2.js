import createSagaMiddleware from 'redux-saga'
import {
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist'
import {PersistGate} from 'redux-persist/integration/react'

export default {
  createSagaMiddleware,
  PersistGate,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
}
