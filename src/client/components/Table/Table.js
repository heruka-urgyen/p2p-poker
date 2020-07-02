import React from 'react'
import Card from '@heruka_urgyen/react-playing-cards'

import Player from './Player'
import {Maybe, safe} from 'client/util'

import chip from 'client/images/poker-chip.svg'

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
      <ul className="community-cards">
        {round.communityCards.map((c, i) =>
          <li key={`cc${i + 1}`} className={`card community-card__${i + 1}`}>
            <Card card={c.rank + c.suit} />
          </li>
        )}
      </ul>
      <Maybe cond={round.pot > 0}>
        <div className="pot">
          <img className={`chip chip__1`} src={chip} alt="chip" />
          <img className={`chip chip__2`} src={chip} alt="chip" />
          <img className={`chip chip__3`} src={chip} alt="chip" />
          <label className="pot-amount">${round.pot}</label>
        </div>
      </Maybe>
    </div>
  )
}

export default Table
