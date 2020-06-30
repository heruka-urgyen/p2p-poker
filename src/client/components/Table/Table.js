import React from 'react'

import Player from './Player'
import {Maybe} from 'client/util'

function Table({user, table, players}) {
  const otherPlayers = table.players
    .filter(id => id !== user.id)
    .map(id => players[id])

  return (
    <div className="table">
      <Maybe cond={table.players.length < 2}>
        <div className="table-waiting">
          Waiting for players...
        </div>
      </Maybe>
      <ul className="players">
        <Maybe cond={user.type !== 'guest'}>
          <Player key={1} i={1} player={user} />
        </Maybe>
        {otherPlayers.map((p, i) =>
          <Player key={i + 2} i={i + 2} player={p} />
        )}
      </ul>
    </div>
  )
}

export default Table
