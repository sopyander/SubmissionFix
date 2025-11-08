# TODO: Implement Offline Mode and Sync for Story Upload

## 1. Implement Offline Mode for Page Display
- [x] Modify home-page.js to always display cached stories when offline
- [x] Ensure map and list render from IndexedDB cache

## 2. Implement Offline Story Upload with Sync
- [x] Add IndexedDB store for pending stories in db-helper.js
- [x] Modify add-story-page.js to save stories locally when offline
- [x] Add sync logic in app.js to upload pending stories when online (replaced background sync)
- [x] Update api.js to handle offline queue

## 3. Handle Redundant Service Worker on Deployment
- [x] Remove public/service-worker.js since src/service-worker.js is used
- [x] Update webpack config to handle service worker properly
- [x] Ensure only one service worker is registered

## 4. Testing and Verification
- [ ] Test offline page display
- [ ] Test offline story upload and sync
- [ ] Verify no redundant service workers
