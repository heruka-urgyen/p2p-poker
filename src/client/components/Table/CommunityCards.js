import React, {Suspense, lazy} from 'react'

import {Either} from 'client/util'

const Card = lazy(() => import('@heruka_urgyen/react-playing-cards'))

function CommunityCards({communityCards, showWinningCards}) {
  return (
    <ul className="community-cards">
      {communityCards.map((c, i) =>
        <li
          key={`cc${i + 1}`}
          className={`card community-card__${i + 1} ${showWinningCards(c)}`}>
        <Either cond={c.type === 'outline'}>
          <div className="outline" />
          <Suspense fallback={null}>
            <Card card={c.rank + c.suit} />
          </Suspense>
        </Either>
        </li>
      )}
    </ul>
  )
}

export default CommunityCards
