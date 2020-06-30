import React, {useState} from 'react'
import {useDispatch} from 'react-redux'

import {sitUser} from 'client/reducers/table'

const handleSubmitForm = dispatch => formValues => e => {
  e.preventDefault()
  dispatch(sitUser(formValues))
}

function Login({table}) {
  const dispatch = useDispatch()
  const [formValues, updateName] = useState({username: ""})
  const {maxPlayers, players} = table

  const tableIsFull = players.length === maxPlayers
  const submitIsDisabled = formValues.username.length === 0 || tableIsFull

  return (
    <div>
      <div className="login-overlay" />
      <form className="login-form" onSubmit={handleSubmitForm(dispatch)(formValues)}>
        <h1>
          {tableIsFull? "Table is full" : `${players.length} / ${maxPlayers} players`}
        </h1>
        <input
          className="login-form__username"
          placeholder="your name"
          type="text"
          onChange={e => updateName({username: e.target.value})} />
        <input
          className="login-form__submit"
          disabled={submitIsDisabled}
          type="submit"
          value="Sit at this table" />
      </form>
    </div>
  )
}

export default Login
