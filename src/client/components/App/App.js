import React from 'react'
import {useSelector} from 'react-redux'

import Table from 'client/components/Table'
import Controls from 'client/components/Controls'
import Login from 'client/components/Login'
import {Maybe, safe} from 'client/util'

function App() {
  const user = useSelector(s => s.user)
  const table = useSelector(s => s.table)
  const players = useSelector(s => s.players)
  const round = useSelector(s => s.round)

  if (!(user && table)) {return null}

  const controlsDisabled = round.status === 'FINISHED'
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
        <Controls player={user} isDisabled={controlsDisabled} />
      </main>
    </div>
  )
}

export default App
