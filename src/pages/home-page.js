  import { fetchStories } from '../utils/api.js';
  import '../components/loading-indicator.js';
  import '../components/story-item.js';
  import 'leaflet/dist/leaflet.css';
  import L from 'leaflet';
  import DBHelper from '../utils/db-helper.js'; 

  export default class HomePage {
    async render() {
      return `
        <section class="page-content container" tabindex="-1">
          <h1>Peta Cerita</h1>
          <div id="map" class="map card" aria-label="Peta lokasi cerita" role="region"></div>
          <h2>Daftar Cerita</h2>
          <div id="list" class="grid-list" aria-live="polite"></div>
        </section>
      `;
    }

    async afterRender() {
      const listEl = document.getElementById('list');
      const mapEl = document.getElementById('map');
      const loading = document.createElement('loading-indicator');
      listEl.innerHTML = '';
      listEl.appendChild(loading);

      // Always try to load from cache first for offline support
      let stories = await DBHelper.getAllStories();
      if (stories.length > 0) {
        this.renderStoryList(stories);
        this.initMap(stories);
      }

      try {
        const res = await fetchStories({ page: 1, size: 50 });
        const onlineStories = res.listStory || [];

        await DBHelper.putAllStories(onlineStories);

        // Update display with fresh data
        this.renderStoryList(onlineStories);
        this.initMap(onlineStories);
      } catch (err) {
        console.error('Gagal fetch online, menggunakan data cache:', err);
        if (stories.length === 0) {
          listEl.innerHTML = `<p>Gagal memuat data online. Tidak ada data offline tersedia.</p>`;
        }
      } finally {
        if (listEl.contains(loading)) {
          listEl.removeChild(loading);
        }
      }
    }


    renderStoryList(stories) {
      const listEl = document.getElementById('list');
      listEl.innerHTML = '';

      if (stories.length === 0) {
        listEl.innerHTML = '<p>Tidak ada cerita yang ditemukan.</p>';
        return;
      }

      stories.forEach(story => {
        const item = document.createElement('story-item');
        item.data = story;
        listEl.appendChild(item);

        item.addEventListener('click', () => {
          const map = document.getElementById('map')._leaflet_map;
          if (map && story.lat && story.lon) {
            map.flyTo([story.lat, story.lon], 15);
          }
        });
      });
    }

    initMap(stories) {
      const mapEl = document.getElementById('map');

      if (mapEl._leaflet_map) {
        mapEl._leaflet_map.remove();
      }

      const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });

      const satelliteMap = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri' }
      );

      const map = L.map(mapEl, { layers: [streetMap], zoomControl: true }).setView([0, 0], 2);
      mapEl._leaflet_map = map;

      const baseMaps = { "Streets": streetMap, "Satellite": satelliteMap };
      L.control.layers(baseMaps).addTo(map);

      const markers = [];

      function getCustomIcon(story) {
        let iconUrl;
        if (story.name && story.name.toLowerCase().includes('admin')) {
          iconUrl = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
        } else if (story.description && story.description.toLowerCase().includes('lucu')) {
          iconUrl = 'https://cdn-icons-png.flaticon.com/512/742/742751.png';
        } else if (story.description && story.description.toLowerCase().includes('sedih')) {
          iconUrl = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
        } else {
          iconUrl = 'https://cdn-icons-png.flaticon.com/512/684/684908.png';
        }

        return L.icon({
          iconUrl,
          iconSize: [38, 45],
          iconAnchor: [19, 45],
          popupAnchor: [0, -40]
        });
      }

      stories.forEach(story => {
        if (story.lat && story.lon) {
          const marker = L.marker([story.lat, story.lon], { icon: getCustomIcon(story) }).addTo(map);
          marker.bindPopup(`
            <strong>${story.name}</strong>
            <p>${story.description}</p>
            ${story.photoUrl ? `<img src="${story.photoUrl}" alt="${story.name}" style="width:120px;border-radius:8px;">` : ''}
          `);
          markers.push(marker);
        }
      });


      if (markers.length > 1) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.2));
      } else {
        map.setView([-2.5489, 118.0149], 5);
      }
    }
  }
