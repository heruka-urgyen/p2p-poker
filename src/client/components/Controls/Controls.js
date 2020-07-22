import React, {useState} from 'react'
import {useDispatch} from 'react-redux'
import Draggable from 'react-draggable'

import {fold, bet} from 'client/reducers/game'

function Controls({round, player, stack, minBet, isDisabled}) {
  const dispatch = useDispatch()

  const [betAmount, updateBet] = useState(minBet)

  return (
    <Draggable>
      <div className="controls">
        <div className="controls__adjust-bet">
          <button
            className="controls__button"
            disabled={isDisabled}
            onClick={_ => updateBet(3 * round.blinds.snd)}
          >{"3BB"}</button>

          <button
            className="controls__button"
            disabled={isDisabled}
            onClick={_ => updateBet(stack)}
          >All in</button>
        </div>

        <div className="controls__bet-size">
          <input
            className="bet-size__input"
            type="number"
            placeholder="Bet size"
            value={betAmount || minBet}
            onChange={e => updateBet(Math.min(e.target.value, stack))}
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
        <div className="controls__bet-controls">
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
        </div>
      </div>
    </Draggable>
  )
}

export default Controls
