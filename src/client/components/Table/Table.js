import React from 'react'
import Card from '@heruka_urgyen/react-playing-cards'

import Player from './Player'
import {Maybe, safe} from 'client/util'

import chip from 'client/images/poker-chip.svg'

const showCard = c => c.rank + c.suit
const showWinningCards = round => card => {
  const isWinner =
    round.winners.filter(w => w.cards.map(showCard).indexOf(showCard(card)) > -1).length > 0
  const isShowdown = round.status === 'SHOWDOWN'

  return (isShowdown? 'showdown' : '') + (isWinner? ' winner' : '')
}

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
          {(() =>
          <Player
            key={1}
            i={1}
            player={players[user.id]}
            round={round}
            showWinningCards={showWinningCards} />)}
        </Maybe>
        <Maybe cond={players != null && Object.keys(players).length > 0}>
          {() => table.players
            .filter(id => id !== user.id)
            .map((id, i) =>
              <Player
                key={i + 2}
                i={i + 2}
                player={players[id]}
                round={round}
                showWinningCards={showWinningCards} />
          )}
        </Maybe>
      </ul>
      <ul className="community-cards">
        {round.communityCards.map((c, i) =>
          <li
            key={`cc${i + 1}`}
            className={`card community-card__${i + 1} ${showWinningCards(round)(c)}`}>

            <Card card={c.rank + c.suit} />
          </li>
        )}
      </ul>
      <Maybe cond={() => round.pots.pots}>
        {() => round.pots.pots.map(pot =>
          <div className="pot">
            <img className={`chip chip__1`} src={chip} alt="chip" />
            <img className={`chip chip__2`} src={chip} alt="chip" />
            <img className={`chip chip__3`} src={chip} alt="chip" />
            <label className="pot-amount">${pot.amount}</label>
          </div>
        )}
      </Maybe>
    </div>
  )
}

export default Table
