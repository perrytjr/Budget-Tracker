const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

const iconSizes = ["192", "512"];
const iconFiles = iconSizes.map(
    (size) => `/icons/icon-${size}x${size}.png`
);

const FILES_TO_CACHE = [
    "/",
    "/db.js",
    "/index.js",
    "/styles.css",
    "/manifest.webmanifest",
].concat(iconFiles);

// Installs
self.addEventListener("install", function(evt){
    // Pre-cache all static assets
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    // This tells the browser to activate this service worker immediately once it has finished installing
    self.skipWaiting();
});

// Activate
self.addEventListener("activate", function(evt){
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Remove old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});


// Fetch
self.addEventListener("fetch", function(evt){
    const {url} = evt.request;
    if (url.includes("/api/")) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request)
                .then(response => {
                    // If the response was good, clone it and store it to the cache.
                    if (response.status === 200){
                        cache.put(evt.request, response.clone());
                    }

                    return response;
                })
                .catch(error => {
                    return cache.match(evt.request);
                });
            }).catch(error => console.log(error))
        );
    }else{
        evt.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(evt.request).then(response => {
                    return response || fetch(evt.request);
                });
            })
        );
    }
});