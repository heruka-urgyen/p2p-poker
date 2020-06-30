import React, {useState} from 'react'
import {useDispatch} from 'react-redux'

const handleSubmitForm = dispatch => formValues => e => {
  e.preventDefault()
}

function Login() {
  const dispatch = useDispatch()
  const [formValues, updateName] = useState({username: ""})

  const submitIsDisabled = formValues.username.length === 0

  return (
    <div>
      <div className="login-overlay" />
      <form className="login-form" onSubmit={handleSubmitForm(dispatch)(formValues)}>
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
