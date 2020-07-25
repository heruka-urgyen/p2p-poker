import React, {useState} from 'react'
import {useDispatch} from 'react-redux'
import {useLocation} from 'react-router-dom'

import {sitUser} from 'client/reducers/table'

const handleSubmitForm = dispatch => formValues => e => {
  e.preventDefault()
  dispatch(sitUser(formValues))
}

function Login({table, loading}) {
  const {pathname} = useLocation()
  const dispatch = useDispatch()
  const [formValues, updateName] = useState({username: ""})
  const {maxPlayers, players} = table

  const tableIsFull = players.length === maxPlayers
  const submitIsDisabled = formValues.username.length === 0 || tableIsFull
  const submitLabel = pathname === '/'? 'Create table' : 'Sit at this table'
  const header = loading?
    'Connecting...' :
    tableIsFull?
      'Table is full' :
      `${players.length} / ${maxPlayers} players`

  return (
    <div>
      <div className="login-overlay" />
      <form
        className="login-form"
        onSubmit={handleSubmitForm(dispatch)({...formValues, pathname})}>

        <h1>{header}</h1>
        <input
          className="login-form__username"
          placeholder="your name"
          type="text"
          disabled={loading}
          autoFocus
          onChange={e => updateName({username: e.target.value})} />
        <input
          className="login-form__submit"
          disabled={submitIsDisabled}
          type="submit"
          value={submitLabel} />
      </form>
    </div>
  )
}

export default Login
