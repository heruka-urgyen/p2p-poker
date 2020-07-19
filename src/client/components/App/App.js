import React from 'react'
import {useSelector} from 'react-redux'

import Main from './Main'
import Login from 'client/components/Login'
import {Either} from 'client/util'

import {
  Route,
  Redirect,
  Switch,
  useLocation,
} from 'react-router-dom'

function App() {
  const {pathname} = useLocation()

  const [user, table, round] = useSelector(s => [s.user, s.table, s.round])
  if (!(user)) {return null}

  return (
    <div className="app">
      <Either cond={user.type === 'guest'}>

        <Login table={table} />

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
