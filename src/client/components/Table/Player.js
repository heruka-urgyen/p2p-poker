import React from 'react'

import {Maybe} from 'client/util'

function Player({i, player, round}) {
  const buttonPlayerId = round.players[round.button]

  return (
    <li className={`player player__${i}`}>
      <label className="player-name">{player.username}</label>
      <label className="player-stack">${player.stack}</label>
      <Maybe cond={() => buttonPlayerId === player.id}>
        <label className={`dealer-button dealer-button__${i}`}>D</label>
      </Maybe>
    </li>
  )
}

export default Player
