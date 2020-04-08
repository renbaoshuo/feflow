export default function (routeName = '') {
  const isDev = process.env.NODE_ENV === 'development'

  let localUrl = 'http://localhost:9080/'
  let serveUrl = `http://localhost:9081/`
  if (routeName) {
    localUrl += `#/${routeName}`
    serveUrl += `#/${routeName}`
  }

  return isDev ? localUrl : serveUrl
}
