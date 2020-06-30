import React from 'react'
import {useSelector} from 'react-redux'

import Table from 'client/components/Table'
import Login from 'client/components/Login'
import {Maybe} from 'client/util'

function App() {
  const user = useSelector(s => s.user)
  const table = useSelector(s => s.table)

  if (!(user && table)) {return null}

  return (
    <div className="App">
      <Maybe cond={user.type === 'guest'}>
        <Login table={table} />
      </Maybe>

      <header className="App-header" data-testid="App-header">
      </header>
      <main>
        <Table table={table} />
      </main>
    </div>
  )
}

export default App
