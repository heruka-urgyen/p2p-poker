import React from 'react'
import {useSelector} from 'react-redux'

import {Maybe, Either} from 'client/util'

import {
  Route,
  Redirect,
  Switch,
} from 'react-router-dom'

import Main from './Main'
import Login from 'client/components/Login'

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
        <Login table={table} loading={loading} />

        <div className="main-wrapper">
          <Switch>
            <Route path={`/${ui.roomId}`}>
              <Main user={user} table={table} round={round} />
            </Route>
            <Redirect to={`/${ui.roomId}`} />
          </Switch>
        </div>
      </Either>
    </div>
  )
}

export default App
