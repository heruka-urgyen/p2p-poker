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
  const b = typeof children === 'function'

  if (a && b) {
    return safe(false)(cond)? children() : null
  }

  if (a && !b) {
    return safe(false)(cond)? children : null
  }

  if (!a && b) {
    return cond? children() : null
  }

  return cond? children : null
}

export const Either = ({cond, children}) =>
  Maybe({cond, children: children[0]}) || safe(children[1])(children[1])

