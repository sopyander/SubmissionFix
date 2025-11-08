// src/app.js

import routes from './routes/routes.js';
import { getActiveRoute } from './routes/url-parser.js';
import './components/loading-indicator.js';
import PushNotification from './utils/push-notification-helper.js';
import DBHelper from './utils/db-helper.js';
import { addStory } from './utils/api.js';

export default class App {
  constructor({ content }) {
    this.content = content;
    this.logoutHandler = this.logout.bind(this);
  }

  async init() {
    this.updateHeader();
    await this.render();
    this._initNotificationButton();
    this._initSync();
  }

  // PERBAIKAN: Menambahkan pesan yang lebih informatif berdasarkan status izin
  _initNotificationButton() {
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
      notificationBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        try {
          const result = await PushNotification.requestPermission();
          
          if (result === 'granted') {
            alert('Terima kasih! Notifikasi telah diaktifkan.');
          } else if (result === 'denied') {
            alert(
              'Anda telah memblokir izin notifikasi. ' +
              'Harap aktifkan secara manual melalui setelan browser jika Anda ingin menerima notifikasi.'
            );
          } else {
            alert('Permintaan izin notifikasi ditutup. Anda bisa mencobanya lagi nanti.');
          }

        } catch (err) {
          console.error('Gagal meminta izin notifikasi:', err);
          alert('Gagal mengaktifkan notifikasi.');
        }
      });
    } else {
      console.warn('Tombol notifikasi (#notificationBtn) tidak ditemukan.');
    }
  }

  updateHeader() {
    const token = localStorage.getItem('story_token');
    const loginLink = document.getElementById('login-link');
    const addStoryLink = document.querySelector('a[href="#/add-story"]');
    const favoriteLink = document.querySelector('a[href="#/favorite"]');

    if (!loginLink) return;

    loginLink.removeEventListener('click', this.logoutHandler);

    if (token) {
      loginLink.textContent = 'Logout';
      loginLink.removeAttribute('href');
      loginLink.style.cursor = 'pointer';
      addStoryLink && (addStoryLink.style.display = 'inline');
      favoriteLink && (favoriteLink.style.display = 'inline');
      loginLink.addEventListener('click', this.logoutHandler);
    } else {
      loginLink.textContent = 'Login';
      loginLink.setAttribute('href', '#/login');
      loginLink.style.cursor = 'pointer';
      addStoryLink && (addStoryLink.style.display = 'none');
      favoriteLink && (favoriteLink.style.display = 'none');
    }
  }

  logout(event) {
    event.preventDefault();
    localStorage.removeItem('story_token');
    this.updateHeader();
    window.location.hash = '/login';
  }

  async render() {
    this.updateHeader();

    const url = getActiveRoute();
    const page = routes[url] || routes['/'];

    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        this.content.innerHTML = await page.render();
        if (page.afterRender) await page.afterRender();
        this.content.querySelector('.page-content')?.focus();
      });
    } else {
      this.content.innerHTML = '<loading-indicator></loading-indicator>';
      this.content.innerHTML = await page.render();
      if (page.afterRender) await page.afterRender();
      this.content.querySelector('.page-content')?.focus();
    }
  }

  _initSync() {
    // Sync pending stories when coming back online
    window.addEventListener('online', () => {
      console.log('Back online, syncing pending stories...');
      this._syncPendingStories();
    });

    // Sync on app init if already online
    if (navigator.onLine) {
      this._syncPendingStories();
    }
  }

  async _syncPendingStories() {
    try {
      const pendingStories = await DBHelper.getAllPendingStories();
      if (pendingStories.length === 0) return;

      console.log(`Syncing ${pendingStories.length} pending stories...`);

      for (const story of pendingStories) {
        try {
          const res = await addStory({
            description: story.description,
            photoFile: story.photoFile,
            lat: story.lat,
            lon: story.lon
          });

          if (res && res.error === false) {
            await DBHelper.deletePendingStory(story.id);
            console.log('Synced story:', story.id);
          } else {
            console.error('Failed to sync story:', story.id, res.message);
          }
        } catch (err) {
          console.error('Error syncing story:', story.id, err);
        }
      }
    } catch (err) {
      console.error('Error syncing pending stories:', err);
    }
  }
}
