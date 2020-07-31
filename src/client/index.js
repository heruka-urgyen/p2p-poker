// eslint-disable-next-line
import('./index.css')

const render = async isProd => {
  const ReactDOM = await import('react-dom').then(x => x.default)
  const {React, configureStore, getDefaultMiddleware, Provider, Router} =
    await import('./chunk1.js').then(x => x.default)

  const ms = await Promise.all([
    import(
      /* webpackchunkname: 'c2' */
      './chunk2'),
    import(
      /* webpackchunkname: 'c2' */
      './history'),
    import(
      /* webpackChunkName: 'c2' */
      './sagas'),
    import(
      /* webpackChunkName: 'c2' */
      './reducers'),
    import(
      /* webpackChunkName: 'c2' */
      'client/components/App'),
  ])

  const [
    {
      createSagaMiddleware,
      PersistGate,
      persistStore,
      FLUSH,
      REHYDRATE,
      PAUSE,
      PERSIST,
      PURGE,
      REGISTER,
    },
    history,
    saga,
    reducer,
    App,
  ] = ms.map(x => x.default)

  const sagaMiddleware = createSagaMiddleware()

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

  const store = configureStore({
    reducer,
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

