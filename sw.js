const CACHE_NAME = 'CFF-CACHE';
self.addEventListener('install', () => {
  caches.open(CACHE_NAME);
});

//intercept all network requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
    .then(response => {
      if (response) { //if request is in cache, respond with cached request
        return response;
      }

      //otherwise fetch request over the network
      return fetch(event.request.clone()).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        var clone = response.clone();
        //cache response for future use
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, clone);
          });
        return response;
      });
    })
  );
});
