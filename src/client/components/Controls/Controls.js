import React from 'react'
import {useDispatch} from 'react-redux'

import {fold, bet} from 'client/reducers/round'

function Controls({player, minBet, isDisabled}) {
  const dispatch = useDispatch()

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
    </div>
  )
}

export default Controls
