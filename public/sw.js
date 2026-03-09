// No-op service worker — prevents 404 errors.
// This file exists solely to suppress the browser's automatic request for /sw.js
// triggered by the web app manifest with "display": "standalone".
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
