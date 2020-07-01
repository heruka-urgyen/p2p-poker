import React from 'react'
import {useSelector} from 'react-redux'

import Table from 'client/components/Table'
import Login from 'client/components/Login'
import {Maybe} from 'client/util'

function App() {
  const user = useSelector(s => s.user)
  const table = useSelector(s => s.table)
  const players = useSelector(s => s.players)
  const round = useSelector(s => s.round)

  if (!(user && table)) {return null}

  return (
    <div className="app">
      <Maybe cond={user.type === 'guest'}>
        <Login table={table} />
      </Maybe>

      <header className="app-header">
      </header>
      <main>
        <Table user={user} table={table} players={players} round={round} />
      </main>
    </div>
  )
}

export default App
