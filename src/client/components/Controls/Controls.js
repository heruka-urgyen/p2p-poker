import React, {useState} from 'react'
import {useDispatch} from 'react-redux'
import Draggable from 'react-draggable'

import {fold, bet, leave} from 'client/reducers/game'

function Controls({round, player, stack, minBet, isDisabled}) {
  const dispatch = useDispatch()

  const [betAmount, updateBet] = useState(minBet)
  const cancelDrag = `
    .bet-size__slider,
    .bet-size__input,
    .controls__button,
    .controls__leave`

  return (
    <Draggable cancel={cancelDrag}>
      <div className="controls">
        <div className="controls__leave" onClick={_ => dispatch(leave({id: player.id}))}>
          <span className="controls__leave-door" />
          <span className="controls__leave-arrow"></span>
        </div>
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
            onChange={e => updateBet(Math.min(e.target.value, stack))}
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
            onClick={_ =>
              dispatch(bet({player, amount: Math.min(parseInt(betAmount), stack)}))}
          >Bet</button>
        </div>
      </div>
    </Draggable>
  )
}

export default Controls
