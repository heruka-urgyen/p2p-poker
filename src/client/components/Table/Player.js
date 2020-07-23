import React from 'react'
import Card from '@heruka_urgyen/react-playing-cards'
import {STREETS} from '@heruka_urgyen/poker-solver'

import {Maybe, safe} from 'client/util'

import chip from 'client/images/poker-chip.svg'

function Player({i, player, isCurrentUser, round, showWinningCards}) {
  const buttonPlayerId = safe(null)(() => round.players[round.button])
  const bet = safe({})(() => round.bets.filter(b => b.playerId === player.id)[0])
  const isShowdown = round.street === STREETS[4]

  const cards = safe([])(() => round.cards.filter(c => c.fst === player.id).map(c => {
    if (isCurrentUser || isShowdown) {return c.snd}
    return [{type: 'hidden'}, {type: 'hidden'}]
  })[0])
  const timeout = safe(0)(() => player.timeout)

  return (
    <li className={`player player__${i}`}>
      <Maybe cond={cards.length > 0}>
        <ul className="hole-cards">
          {cards.map((c, i) =>
            <li
              key={`card__${i + 1}`}
              className={`card__${i + 1} ${showWinningCards(c)}`}>
              <Card card={c.rank + c.suit} back={c.type === 'hidden'} />
            </li>
          )}
        </ul>
      </Maybe>
      {timeout > 0?
        <div className="player-name-wrapper">
          <label className="player-name">waiting</label>
          <label className="player-stack">{timeout}</label>
        </div>
        :
        <div className="player-name-wrapper">
          <label className="player-name">{player.username}</label>
          <label className="player-stack">${player.stack}</label>
        </div>
      }
      <Maybe cond={() => buttonPlayerId === player.id}>
        <label className={`dealer-button dealer-button__${i}`}>D</label>
      </Maybe>
      <Maybe cond={!!bet.amount}>
        <div className={`bet bet__${i}`}>
          <div className="chips">
            <img className={`chip chip__1`} src={chip} alt="chip" />
            <img className={`chip chip__2`} src={chip} alt="chip" />
            <img className={`chip chip__3`} src={chip} alt="chip" />
          </div>
          <label className="bet-amount">{bet.amount}</label>
        </div>
      </Maybe>
    </li>
  )
}

export default Player
