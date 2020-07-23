import React, {useEffect} from 'react'
import {useSelector, useDispatch} from 'react-redux'

import Main from './Main'
import Login from 'client/components/Login'
import {Maybe, Either} from 'client/util'

import {
  Route,
  Redirect,
  Switch,
  useLocation,
} from 'react-router-dom'

const useMountEffect = f => useEffect(f, [])

function App() {
  const {pathname} = useLocation()
  const dispatch = useDispatch()
  useMountEffect(() => {dispatch({type: 'INITIALIZE', payload: {pathname}}, [])})

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
      <Maybe cond={!uiError && ui.timer.active}>
        <div className="turn-timer">
          <span className="turn-timer__username">{ui.timer.username}</span>
          {` time to decision: `}
          <span className="turn-timer__value">{ui.timer.seconds}</span>
        </div>
      </Maybe>
      <Either cond={user.type === 'guest'}>
        <Login table={table} loading={loading} />

        <div className="main-wrapper">
          <Either cond={pathname !== '/'}>
            <Main user={user} table={table} round={round} />

            <Switch>
              <Redirect to={`/${user.id || '/'}`} />
              <Route path={`/${user.id}`}>
                <Main user={user} table={table} round={round} />
              </Route>
            </Switch>
          </Either>
        </div>
      </Either>
    </div>
  )
}

export default App
