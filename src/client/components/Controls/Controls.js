import React, {useState} from 'react'
import {useDispatch} from 'react-redux'

import {fold, bet} from 'client/reducers/round'

function Controls({player, stack, minBet, isDisabled}) {
  const dispatch = useDispatch()
  const [betAmount, updateBet] = useState(minBet)

  return (
    <div className="controls">
      <button
        className="controls__button"
        disabled={isDisabled}
        onClick={_ => dispatch(fold(player))}
      >Fold</button>

      <button
        className="controls__button"
        disabled={isDisabled}
        onClick={_ => dispatch(bet({player, amount: minBet}))}
      >{minBet === 0? "Check" : "Call"}</button>

      <button
        className="controls__button"
        disabled={isDisabled || minBet > parseInt(betAmount)}
        onClick={_ => dispatch(bet({player, amount: parseInt(betAmount)}))}
      >Bet</button>

      <div className="controls__bet-size">
        <input
          className="bet-size__input"
          type="number"
          placeholder="Bet size"
          value={betAmount || minBet}
          onChange={e => updateBet(e.target.value)}
          disabled={isDisabled} />

        <input
          className="bet-size__slider"
          type="range"
          min={minBet}
          max={stack}
          value={betAmount || minBet}
          onChange={e => updateBet(e.target.value)}
          disabled={isDisabled}
        />
      </div>
    </div>
  )
}

export default Controls
