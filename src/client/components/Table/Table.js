import React from 'react'

import Player from './Player'
import {Maybe, safe} from 'client/util'

function Table({user, table, players, round}) {
  return (
    <div className="table">
      <Maybe cond={table.players.length < 2}>
        <div className="table-waiting">
          Waiting for players...
        </div>
      </Maybe>
      <ul className="players">
        <Maybe cond={user.type !== 'guest' && safe(false)(() => !!players[user.id])}>
          {(() => <Player key={1} i={1} player={players[user.id]} round={round} />)}
        </Maybe>
        <Maybe cond={players != null && Object.keys(players).length > 0}>
          {() => table.players
            .filter(id => id !== user.id)
            .map((id, i) =>
              <Player key={i + 2} i={i + 2} player={players[id]} round={round} />
          )}
        </Maybe>
      </ul>
    </div>
  )
}

export default Table
