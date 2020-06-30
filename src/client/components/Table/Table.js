import React from 'react'

import {Maybe} from 'client/util'

function Table({table}) {
  return (
    <div className="Table">
      <Maybe cond={table.players.length < 2}>
        <div className="Table-waiting">
          Waiting for players...
        </div>
      </Maybe>
    </div>
  )
}

export default Table
