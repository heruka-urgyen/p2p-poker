import React from 'react'

import Table from 'client/components/Table'
import Controls from 'client/components/Controls'
import {Maybe, safe} from 'client/util'

const getMinBet = ({round, user, stack}) => {
  if (round.status !== 'IN_PROGRESS') {
    return 0
  }

  if (round.bets.length === 0) {
    return 0
  }

  return Math.min(stack, Math.max.apply([], round.bets.map(b => b.amount)) -
    safe(0)(() => round.bets.filter(p => p.playerId === user.id)[0].amount))
}

function Main({user, table, round}) {
  const stack = safe(0)(() => table.players.find(p => p.id === user.id).stack)
  const minBet = getMinBet({round, user, stack})
  const controlsDisabled = round.status === 'FINISHED'
    || round.street === 'SHOWDOWN'
    || safe(true)(() => round.nextPlayer !== user.id)

  return (
    <main>
      <Table user={user} table={table} round={round} />
      <Maybe cond={table.players.length > 1}>
        <Controls
          round={round}
          player={user}
          stack={stack}
          minBet={minBet}
          isDisabled={controlsDisabled} />
      </Maybe>
    </main>
  )
}

export default Main
