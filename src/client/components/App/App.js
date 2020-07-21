import React, {useEffect} from 'react'
import {useSelector, useDispatch} from 'react-redux'

import Main from './Main'
import Login from 'client/components/Login'
import {Either} from 'client/util'

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

  const [user, table, round] = useSelector(s => [s.user, s.game.table, s.game.round])

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
