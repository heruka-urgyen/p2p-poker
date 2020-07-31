import React, {Suspense, lazy} from 'react'

import {Maybe, safe} from 'client/util'
import {ROUND_STATUS, STREETS} from '@heruka_urgyen/poker-solver'

const Table = lazy(() => import(
  /* webpackChunkName: 'table' */
  /* webpackPreload: true */
'client/components/Table'))
const Controls = lazy(() => import(
  /* webpackChunkName: 'controls' */
  /* webpackPreload: true */
'client/components/Controls'))

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
  const controlsDisabled = round.status === ROUND_STATUS[1]
    || round.status === ROUND_STATUS[2]
    || round.street === STREETS[4]
    || safe(true)(() => round.nextPlayer !== user.id)

  return (
    <main>
      <Suspense fallback={null}>
        <Table user={user} table={table} round={round} />
        <Maybe cond={table.players.length > 1}>
          <Controls
            round={round}
            player={user}
            stack={stack}
            minBet={minBet}
            isDisabled={controlsDisabled} />
        </Maybe>
      </Suspense>
    </main>
  )
}

export default Main
