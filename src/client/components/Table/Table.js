import React from 'react'
import Card from '@heruka_urgyen/react-playing-cards'
import {STREETS} from '@heruka_urgyen/poker-solver'

import Player from './Player'
import EmptyTable from './EmptyTable'
import {Maybe, safe} from 'client/util'

import chip from 'client/images/poker-chip.svg'

const showCard = c => c.rank + c.suit
const showWinningCards = round => card => {
  const isWinner = safe(false)(() => round.winners.filter
    (w => w.hand.value.cards.map(showCard).indexOf(showCard(card)) > -1).length > 0)
  const hasWinners = round.winners.length > 0

  return (hasWinners? 'showdown' : '') + (isWinner? ' winner' : '')
}

function Table({user, table, round}) {
  const player = table.players.find(p => p.id === user.id)

  return (
    <div className="table">
      <Maybe cond={table.players.length < 2}>
        <EmptyTable />
      </Maybe>
      <ul className="players">
        <Maybe cond={user.type !== 'guest' && !!player}>
          {(() =>
            <Player
              key={1}
              i={1}
              player={player}
              isCurrentUser={true}
              round={round}
              showWinningCards={showWinningCards(round)} />)}
        </Maybe>
        <Maybe cond={table.players.length > 0}>
          {() => table.players
            .filter(p => p.id !== user.id)
            .map((player, i) =>
              <Player
                key={i + 2}
                i={i + 2}
                player={player}
                isCurrentUser={false}
                round={round}
                showWinningCards={showWinningCards(round)} />
          )}
        </Maybe>
      </ul>
      <Maybe cond={round.communityCards != null}>
        {() => <ul className="community-cards">
          {round.communityCards.map((c, i) =>
            <li
              key={`cc${i + 1}`}
              className={`card community-card__${i + 1} ${showWinningCards(round)(c)}`}>

              <Card card={c.rank + c.suit} />
            </li>
          )}
        </ul>}
      </Maybe>
      <Maybe cond={() => round.pots.pots}>
        {() => round.pots.pots.map((pot, i) =>
          <div className="pot" key={i}>
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
