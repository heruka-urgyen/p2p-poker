import React, {Suspense, lazy} from 'react'
import {STREETS} from '@heruka_urgyen/poker-solver'

import {Either, Maybe, safe} from 'client/util'

import chip from 'client/images/poker-chip.svg'

const Card = lazy(() => import('@heruka_urgyen/react-playing-cards'))

function Player({i, player, isCurrentUser, round, showWinningCards}) {
  const buttonPlayerId = safe(null)(() => round.players[round.button])
  const bet = safe({})(() => round.bets.filter(b => b.playerId === player.id)[0])
  const isShowdown = round.street === STREETS[4]
  const outlines = [{type: 'outline'}, {type: 'outline'}]

  const cards = safe(outlines)(() => round.cards.filter(c => c.fst === player.id).map(c => {
    if (isCurrentUser || isShowdown) {
      return c.snd.length === 0? outlines : c.snd
    }
    return [{type: 'hidden'}, {type: 'hidden'}]
  })[0])

  return (
    <li className={`player player__${i}`}>
      <div className="player--cards-name">
        <ul className="hole-cards">
          {cards.map((c, i) =>
            <li
              key={`card__${i + 1}`}
              className={`card__${i + 1} ${showWinningCards(c)}`}>
              <Either cond={c.type === 'outline'}>
                <div className="outline" />
                <Suspense fallback={<div className="outline" />}>
                  <Card card={c.rank + c.suit} back={c.type === 'hidden'} />
                </Suspense>
              </Either>
            </li>
          )}
        </ul>
        <div className="player-name-wrapper">
          <label className="player-name">{player.username}</label>
          <label className="player-stack">${player.stack}</label>
        </div>
      </div>
      <div className="player--button-bet">
        <label
          className={`
            dealer-button
            ${buttonPlayerId === player.id || 'dealer-button__hidden '}
            dealer-button__${i}`}>
          D
        </label>
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
      </div>
    </li>
  )
}

export default Player
