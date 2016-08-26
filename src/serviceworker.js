const CACHE_NAME = 'web-playlist-cache'
const urlsToCache = [
  '/',
  '/index.html',
  '/vendor.bundle.js',
  '/app.bundle.js',
]

//caches to not delete on-activate
const cacheWhitelist = []




self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache)
    })
  )
})
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {

      //try fetching new version; otherwise (if offline) serve cached
      return fetch(event.request).catch( () => response )

    })
  )
})
self.addEventListener('activate', event => {
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        if (cacheWhitelist.indexOf(cacheName) === -1) {
          return caches.delete(cacheName)
        }
      })
    )
  })
})
