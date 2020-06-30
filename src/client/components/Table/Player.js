import React from 'react'

function Player({i, player}) {
  return (
    <li className={`player player__${i}`}>
      <label className="player-name">{player.username}</label>
      <label className="player-stack">${player.stack}</label>
    </li>
  )
}

export default Player
