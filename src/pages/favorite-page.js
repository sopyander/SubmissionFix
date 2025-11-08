import DBHelper from '../utils/db-helper.js';
import '../components/story-item.js';

export default class FavoritePage {
  async render() {
    return `
      <section class="page-content container" tabindex="-1">
        <h1>Cerita Favorit Anda</h1>
        <div id="favorite-list" class="grid-list" aria-live="polite">
          <loading-indicator></loading-indicator>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const listEl = document.getElementById('favorite-list');
    try {
        const stories = await DBHelper.getAllFavoriteStories();

        listEl.innerHTML = '';
        if (stories.length === 0) {
          listEl.innerHTML = '<p>Anda belum memiliki cerita favorit. Tambahkan cerita ke favorit dengan menekan tombol hati ❤️.</p>';
          return;
        }

        stories.forEach(story => {
          const item = document.createElement('story-item');
          item.data = story;
          listEl.appendChild(item);
        });
    } catch(err) {
        listEl.innerHTML = `<p>Gagal memuat cerita favorit: ${err.message}</p>`;
        // Fallback: tampilkan pesan offline
        listEl.innerHTML = '<p>Cerita favorit tersimpan secara offline. Pastikan Anda telah menandai cerita sebagai favorit saat online.</p>';
    }
  }
}