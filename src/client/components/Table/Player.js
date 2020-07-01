import React from 'react'

import {Maybe, safe} from 'client/util'

import chip from 'client/images/poker-chip.svg'

function Player({i, player, round}) {
  const buttonPlayerId = safe(null)(() => round.players[round.button])
  const bet = safe({})(() => round.bets.filter(b => b.playerId === player.id)[0])

  return (
    <li className={`player player__${i}`}>
      <label className="player-name">{player.username}</label>
      <label className="player-stack">${player.stack}</label>
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
