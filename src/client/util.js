export const safe = def => f => {
  try {
    const res = f()
    return res != null? res : def
  } catch (e) {
    return def
  }
}

export const Maybe =({cond, children}) => {
  if (typeof cond === 'function') {
    return safe(false)(cond)? children : null
  }

  return cond? children : null
}

