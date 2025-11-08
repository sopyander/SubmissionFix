import { addStory } from '../utils/api.js';
import DBHelper from '../utils/db-helper.js';
import 'leaflet/dist/leaflet.js';
import 'leaflet/dist/leaflet.css';

export default class AddStoryPage {
  constructor() {
    this.stream = null;
    this.capturedFile = null;
  }

  async render() {
    return `
      <section class="page-content container" tabindex="-1">
        <h1>Tambah Cerita Baru</h1>
        <form id="form" class="card" aria-label="Formulir tambah cerita">
          
          <label for="description">Deskripsi</label>
          <textarea id="description" name="description" rows="4" required aria-label="Deskripsi cerita"></textarea>
          
          <label for="photo">Foto</label>
          <input id="photo" name="photo" type="file" accept="image/*" required aria-label="Unggah foto" />
          
          <div class="camera-controls">
            <p>Atau ambil dari kamera:</p>
            <button type="button" id="cameraBtn" aria-label="Buka kamera">Buka Kamera</button>
            <div id="camera-container" style="display:none;">
              <video id="video" autoplay playsinline aria-label="Tampilan kamera"></video>
              <button type="button" id="snapBtn" aria-label="Ambil foto dari kamera">Ambil Foto</button>
              <canvas id="canvas" style="display:none;"></canvas>
            </div>
          </div>

          <p>Klik di peta untuk memilih lokasi</p>
          <div id="map" class="map" aria-label="Peta lokasi"></div>
          
          <label for="lat">Latitude</label>
          <input id="lat" name="lat" type="hidden" aria-label="Latitude">
          
          <label for="lon">Longitude</label>
          <input id="lon" name="lon" type="hidden" aria-label="Longitude">
          
          <div class="form-actions">
            <button type="submit" aria-label="Kirim cerita">Kirim Cerita</button>
          </div>
        </form>
      </section>
    `;
  }
  
  async afterRender() {
    const L = window.L;
    const mapEl = document.getElementById('map');
    const map = L.map(mapEl).setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    let tempMarker = null;

    const customAddIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
      iconSize: [38, 45],
      iconAnchor: [19, 45],
      popupAnchor: [0, -40]
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      document.getElementById('lat').value = lat;
      document.getElementById('lon').value = lng;
      if (tempMarker) tempMarker.remove();
      tempMarker = L.marker([lat, lng], { icon: customAddIcon }).addTo(map);
    });

    const form = document.getElementById('form');
    
    const submitForm = async () => {
      const description = document.getElementById('description').value.trim();
      const photoInput = document.getElementById('photo');
      const photo = this.capturedFile || photoInput.files[0];
      const lat = document.getElementById('lat').value || null;
      const lon = document.getElementById('lon').value || null;

      if (!description) { alert('Deskripsi tidak boleh kosong.'); return; }
      if (!photo) { alert('Anda harus memilih atau mengambil foto.'); return; }
      if (photo.size > 1000000) { alert('Ukuran foto tidak boleh lebih dari 1MB.'); return; }

      const loading = document.createElement('loading-indicator');
      form.appendChild(loading);

      try {
        const res = await addStory({ description, photoFile: photo, lat, lon });
        if (res && res.error === false) {
          alert('Cerita berhasil dikirim!');
          location.hash = '/';
        } else {
          alert('Gagal mengirim cerita: ' + res.message);
        }
      } catch (err) {
        console.error('Online upload failed:', err);
        // Save to pending stories for offline sync
        try {
          // Convert photo to blob for IndexedDB storage
          const photoBlob = photo instanceof Blob ? photo : new Blob([photo], { type: photo.type });
          const storyData = {
            description,
            photoFile: photoBlob,
            lat: lat || null,
            lon: lon || null
          };
          await DBHelper.addPendingStory(storyData);
          alert('Koneksi offline. Cerita disimpan dan akan diupload saat online.');
          location.hash = '/';
        } catch (dbErr) {
          console.error('Failed to save offline:', dbErr);
          alert('Gagal menyimpan cerita offline: ' + dbErr.message);
        }
      } finally {
        if (loading.parentNode) loading.parentNode.removeChild(loading);
      }
    };

    form.addEventListener('submit', (e) => { e.preventDefault(); submitForm(); });
  }
}
