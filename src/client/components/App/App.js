import React from 'react'
import {useSelector} from 'react-redux'

import Table from 'client/components/Table'
import Login from 'client/components/Login'
import {Maybe} from 'client/util'

function App() {
  const user = useSelector(s => s.user)

  if (!user) {return null}

  return (
    <div className="App">
      <Maybe cond={user.type === 'guest'}>
        <Login />
      </Maybe>

      <header className="App-header" data-testid="App-header">
      </header>
      <main>
        <Table />
      </main>
    </div>
  )
}

export default App
