import React, {Suspense, lazy} from 'react'
import {useSelector} from 'react-redux'

import {Maybe, Either} from 'client/util'

import {
  Route,
  Redirect,
  Switch,
} from 'react-router-dom'

const Main = lazy(() =>
  /* webpackChunkName: 'app-main' */
  /* webpackPreload: true */
  import('./Main'))
const Login = lazy(() => import(
  /* webpackChunkName: 'login' */
  /* webpackPreload: true */
'client/components/Login'))

function App() {
  const [user, table, round, ui] =
    useSelector(s => [s.user, s.game.table, s.game.round, s.ui])
  const uiError = ui.error.message.length > 0
  const loading = ui.loading

  return (
    <div className="app">
      <Maybe cond={uiError}>
        <div className="ui-error">
          <span className="ui-error__message">{ui.error.message}</span>
        </div>
      </Maybe>
      <Either cond={user.type === 'guest'}>
        <Suspense fallback={null}>
          <Login table={table} loading={loading} />
        </Suspense>

        <div className="main-wrapper">
          <Suspense fallback={null}>
            <Switch>
              <Route path={`/${ui.roomId}`}>
                <Main user={user} table={table} round={round} />
              </Route>
              <Redirect to={`/${ui.roomId}`} />
            </Switch>
          </Suspense>
        </div>
      </Either>
    </div>
  )
}

export default App
