import React, {lazy} from 'react'
import {showCard, ROUND_STATUS} from '@heruka_urgyen/poker-solver'

import EmptyTable from './EmptyTable'
import {Maybe, safe} from 'client/util'

import chip from 'client/images/poker-chip.svg'

const Player = lazy(() => import(
  /* webpackChunkName: 'pl' */
  /* webpackPreload: true */
'./Player'))
const CommunityCards = lazy(() => import(
  /* webpackChunkName: 'cc' */
  /* webpackPreload: true */
'./CommunityCards'))

const showWinningCards = round => card => {
  const isWinner = safe(false)(() => round.winners.filter
    (w => w.hand.value.cards.map(c => showCard(c)).indexOf(showCard(card)) > -1).length > 0)
  const hasWinners = safe(false)(() => round.winners.length > 0)

  return (hasWinners? 'showdown' : '') + (isWinner? ' winner' : '')
}

const getPlayerProps = ({player, user, round}) => {
  const isCurrentUser = user.type !== 'guest' && player.id === user.id

  return {
    i: isCurrentUser? 1 : 2,
    player,
    isCurrentUser,
    round,
    showWinningCards: showWinningCards(round),
  }
}

function Table({user, table, round}) {
  const outlines = Array.from(Array(5), _ => ({type: 'outline'}))
  const communityCards = safe(outlines)(() =>
    (round.communityCards || []).concat(outlines.slice(round.communityCards.length)))

  return (
    <div className="table">
      <Maybe cond={table.players.length < 2}>
        <EmptyTable />
      </Maybe>
      <Maybe cond={table.players.length > 1}>
        <ul className="players">
          {table.players.map((player, i) =>
            <Player key={i} {...getPlayerProps({player, user, round})} />
          )}
        </ul>
        <div className="community-cards-pots">
          <CommunityCards
            communityCards={communityCards}
            showWinningCards={showWinningCards(round)} />
          <Maybe cond={() => round.pots.pots}>
            {() => round.pots.pots.map((pot, i) =>
              <div className="pot" key={i}>
                <img className={`chip chip__1`} src={chip} alt="chip" />
                <img className={`chip chip__2`} src={chip} alt="chip" />
                <img className={`chip chip__3`} src={chip} alt="chip" />
                <label className="pot-amount">${pot.amount}</label>
              </div>
            )}
          </Maybe>
        </div>
      </Maybe>
    </div>
  )
}

export default Table
