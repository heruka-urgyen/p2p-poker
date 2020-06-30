import React from 'react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import {configureStore, getDefaultMiddleware} from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'

import saga from './sagas'
import reducer from './reducers'

import './index.css'
import App from 'client/components/App'

const sagaMiddleware = createSagaMiddleware()
const middleware = [...getDefaultMiddleware(), sagaMiddleware]
const store = configureStore({reducer, middleware})

sagaMiddleware.run(saga)

ReactDOM.render(
  <Provider store={store}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Provider>,
  document.getElementById('root')
)
