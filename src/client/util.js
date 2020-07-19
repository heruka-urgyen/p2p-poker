export const safe = def => f => {
  try {
    const res = f()
    return res != null? res : def
  } catch (e) {
    return def
  }
}

export const Maybe = ({cond, children}) => {
  const a = typeof cond === 'function'

  if (a) {
    return safe(false)(cond)? safe(children)(children) : null
  }

  return cond? safe(children)(children) : null
}

export const Either = ({cond, children}) =>
  Maybe({cond, children: children[0]}) || safe(children[1])(children[1])

