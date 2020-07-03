import React from 'react'
import {useSelector} from 'react-redux'

import Table from 'client/components/Table'
import Controls from 'client/components/Controls'
import Login from 'client/components/Login'
import {Maybe, safe} from 'client/util'

const getMinBet = ({round, user}) => {
  if (round.status !== 'IN_PROGRESS') {
    return null
  }

  if (round.bets.length === 0) {
    return 0
  }

  return Math.max.apply([], round.bets.map(b => b.amount)) -
    safe(0)(() => round.bets.filter(p => p.playerId === user.id)[0].amount)
}

function App() {
  const user = useSelector(s => s.user)
  const table = useSelector(s => s.table)
  const players = useSelector(s => s.players)
  const round = useSelector(s => s.round)

  if (!(user && table)) {return null}

  const minBet = getMinBet({round, user})
  const stack = safe(minBet)(() => players[user.id].stack)
  const controlsDisabled = round.status === 'FINISHED'
    || round.status === 'SHOWDOWN'
    || safe(true)(() => round.whoseTurn !== user.id)

  return (
    <div className="app">
      <Maybe cond={user.type === 'guest'}>
        <Login table={table} />
      </Maybe>

      <header className="app-header">
      </header>
      <main>
        <Table user={user} table={table} players={players} round={round} />
        <Maybe cond={minBet != null}>
          <Controls
            player={user}
            stack={stack}
            minBet={minBet}
            isDisabled={controlsDisabled} />
        </Maybe>
      </main>
    </div>
  )
}

export default App
