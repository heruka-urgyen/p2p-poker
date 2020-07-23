import React from 'react'

function EmptyTable() {
  return (
    <div className="empty-table">
      <h1 className="empty-table__header">Waiting for players</h1>
      <p className="empty-table__description">
        Copy this URL and send to the person you want to play with. When they join, the game will start automatically
      </p>
      <div className="empty-table__url">
        <input
          className="empty-table__url-input"
          type="text"
          value={document.location.href}
          autoFocus
          readOnly
          onMouseEnter={e => e.currentTarget.select()}
          onFocus={e => e.currentTarget.select()} />
      </div>
    </div>
  )
}

export default EmptyTable
