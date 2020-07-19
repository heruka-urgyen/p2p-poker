import React from 'react'
import {useSelector} from 'react-redux'

import Table from 'client/components/Table'
import Controls from 'client/components/Controls'
import Login from 'client/components/Login'
import {Either, Maybe, safe} from 'client/util'

import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom'

const getMinBet = ({round, user, stack}) => {
  if (round.status !== 'IN_PROGRESS') {
    return null
  }

  if (round.bets.length === 0) {
    return 0
  }

  return Math.min(stack, Math.max.apply([], round.bets.map(b => b.amount)) -
    safe(0)(() => round.bets.filter(p => p.playerId === user.id)[0].amount))
}

function App() {
  const [user, table, round] = useSelector(s => [s.user, s.table, s.round])

  if (!(user)) {return null}

  const stack = safe(0)(() => table.players.find(p => p.id === user.id).stack)
  const minBet = getMinBet({round, user, stack})
  const controlsDisabled = round.status === 'FINISHED'
    || round.street === 'SHOWDOWN'
    || safe(true)(() => round.players[round.nextPlayer] !== user.id)

  return (
    <div className="app">
      <Either cond={user.type === 'guest'}>
        <Login table={table} />
        <Router>
          <Redirect to={`/${user.id || ''}`} />
          <Switch>
            <Route path={`/${user.id}`}>
              <div className="main-wrapper">
                <main>
                  <Table user={user} table={table} round={round} />
                  <Maybe cond={minBet != null}>
                    <Controls
                      round={round}
                      player={user}
                      stack={stack}
                      minBet={minBet}
                      isDisabled={controlsDisabled} />
                  </Maybe>
                </main>
              </div>
            </Route>
          </Switch>
        </Router>
      </Either>
    </div>
  )
}

export default App
