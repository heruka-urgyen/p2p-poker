const baseUrl = 'http://localhost:3001/api/v1'
const fetch2 = method => url => payload =>
  fetch(
    new Request(
      `${baseUrl}/${url}`, {
        method,
        body: JSON.stringify(payload),
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'}}))
  .then(r => {
    if (r.ok) {
      return Promise.resolve(r.json())
    } else {
      return Promise.reject(r.statusText)
    }
  })

export const post = fetch2('POST')
export const get = fetch2('GET')
export const put = fetch2('PUT')
