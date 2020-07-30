import React from 'react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import {configureStore, getDefaultMiddleware} from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import {Router} from 'react-router-dom'
import {PersistGate} from 'redux-persist/integration/react'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist'
import storage from 'redux-persist/lib/storage/session'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'

import history from './history'
import saga from './sagas'
import reducer from './reducers'

import './index.css'
import App from 'client/components/App'

const render = async isProd => {
  const sagaMiddleware = createSagaMiddleware()

  const persistConfig = {
    key: 'root',
    version: 1,
    storage,
    stateReconciler: autoMergeLevel2,
  }

  let middleware = [...getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }),
    sagaMiddleware
  ]

  if (!isProd) {
    const logger = await import('redux-logger').then(l => l.createLogger({collapsed: true}))
    middleware = [...middleware, logger]
  }

  const persistedReducer = persistReducer(persistConfig, reducer)
  const store = configureStore({
    reducer: persistedReducer,
    middleware,
  })

  sagaMiddleware.run(saga)

  ReactDOM.render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistStore(store)}>
        <Router history={history}>
          <App />
        </Router>
      </PersistGate>
    </Provider>,
    document.getElementById('root')
  )
}

render(process.env.NODE_ENV === 'production')

