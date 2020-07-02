import React from 'react'
import {useDispatch} from 'react-redux'

import {fold} from 'client/reducers/round'

function Controls({player, isDisabled}) {
  const dispatch = useDispatch()

  return (
    <div className="controls">
      <button
        className="controls__button"
        disabled={isDisabled}
        onClick={_ => dispatch(fold(player))}
      >Fold</button>
    </div>
  )
}

export default Controls
