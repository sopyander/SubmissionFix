  import { openDB } from 'idb';

  const DB_NAME = 'storymap-db';
  const DB_VERSION = 2;
  const CACHE_OBJECT_STORE = 'stories-cache';
  const FAVORITE_OBJECT_STORE = 'favorite-stories';
  const PENDING_STORIES_OBJECT_STORE = 'pending-stories';

  const dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(CACHE_OBJECT_STORE)) {
        db.createObjectStore(CACHE_OBJECT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FAVORITE_OBJECT_STORE)) {
        db.createObjectStore(FAVORITE_OBJECT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PENDING_STORIES_OBJECT_STORE)) {
        db.createObjectStore(PENDING_STORIES_OBJECT_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });

  const DBHelper = {
    async getAllStories() {
      return (await dbPromise).getAll(CACHE_OBJECT_STORE);
    },
    async putAllStories(stories) {
      if (!stories || stories.length === 0) return;
      const tx = (await dbPromise).transaction(CACHE_OBJECT_STORE, 'readwrite');
      for (const story of stories) {
        await tx.store.put(story);
      }
      await tx.done;
    },

    async getAllFavoriteStories() {
      return (await dbPromise).getAll(FAVORITE_OBJECT_STORE);
    },
    async getFavoriteStory(id) {
      if (!id) return undefined;
      return (await dbPromise).get(FAVORITE_OBJECT_STORE, id);
    },
    async putFavoriteStory(story) {
      if (!story || !story.id) return;
      return (await dbPromise).put(FAVORITE_OBJECT_STORE, story);
    },
    async deleteFavoriteStory(id) {
      if (!id) return;
      return (await dbPromise).delete(FAVORITE_OBJECT_STORE, id);
    },

    async addPendingStory(storyData) {
      if (!storyData) return;
      return (await dbPromise).add(PENDING_STORIES_OBJECT_STORE, { ...storyData, timestamp: Date.now() });
    },

    async getAllPendingStories() {
      return (await dbPromise).getAll(PENDING_STORIES_OBJECT_STORE);
    },

    async deletePendingStory(id) {
      if (!id) return;
      return (await dbPromise).delete(PENDING_STORIES_OBJECT_STORE, id);
    },
  };

  export default DBHelper;