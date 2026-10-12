<template>
  <div class="input-panel">
    <h2 class="input-panel__heading">Configure Cards</h2>

    <!-- Card title -->
    <div class="field">
      <label class="field__label"
        >Card Title <span class="field__hint">(optional)</span></label
      >
      <input
        v-model="cardTitle"
        type="text"
        class="field__input"
        placeholder="e.g. Team Meeting Bingo"
        maxlength="50"
      />
    </div>

    <!-- Spotify import -->
    <div class="spotify-section">
      <div class="spotify-section__header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1db954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
        <span class="spotify-section__title">Import from Spotify</span>

        <!-- Connected badge + disconnect -->
        <template v-if="spotifyToken">
          <span class="spotify-status">
            <span class="spotify-status__dot"></span>
            Connected
          </span>
          <button class="link-btn" @click="disconnectSpotify">Disconnect</button>
        </template>
      </div>

      <!-- Not authorized -->
      <template v-if="!spotifyToken">
        <p class="spotify-section__desc">
          Authorize to import from playlists in your account (yours or ones you collaborate on).
        </p>
        <button class="spotify-btn" :disabled="!clientIdConfigured" @click="connectSpotify">
          Authorize with Spotify
        </button>
        <p v-if="!clientIdConfigured" class="spotify-error">
          NUXT_PUBLIC_SPOTIFY_CLIENT_ID is not set in .env
        </p>
      </template>

      <!-- Authorized: browse or paste playlist URL -->
      <template v-else>
        <button
          class="spotify-btn spotify-browse-btn"
          :disabled="spotifyLoading"
          @click="showPlaylistPicker = true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Browse Playlists
        </button>
        <div class="spotify-url-row">
          <input
            v-model="playlistUrl"
            type="url"
            class="field__input"
            placeholder="Or paste playlist URL…"
            spellcheck="false"
            @keydown.enter="importPlaylist"
          />
          <button
            class="spotify-btn spotify-btn--sm"
            :disabled="spotifyLoading || !playlistUrl.trim()"
            @click="importPlaylist"
          >
            {{ spotifyLoading ? 'Loading…' : 'Import' }}
          </button>
        </div>
        <p v-if="spotifyError" class="spotify-error">{{ spotifyError }}</p>
      </template>
    </div>

    <!-- Word list input -->
    <div class="field">
      <label class="field__label">
        Word / Phrase List
        <span class="field__hint">comma-separated or one per line</span>
      </label>
      <textarea
        v-model="rawText"
        class="field__textarea"
        rows="8"
        placeholder='One item per line or comma-separated.&#10;Use "Song - Artist" for a subtitle line.&#10;&#10;Example:&#10;Bohemian Rhapsody - Queen&#10;Hotel California - Eagles&#10;Billie Jean - Michael Jackson'
        @input="syncFromText"
      />
      <div class="field__meta field__meta--stacked">
        <p class="field__meta-note">
          Long lines are trimmed when cards are generated (max chars per cell — 5×5:
          {{ CELL_TEXT_LIMIT[5].title }} title / {{ CELL_TEXT_LIMIT[5].sub }} subtitle; 4×4:
          {{ CELL_TEXT_LIMIT[4].title }} / {{ CELL_TEXT_LIMIT[4].sub }}).
        </p>
        <div class="field__meta-row">
          <span
            :class="[
              'field__count',
              itemCount < minRequired ? 'field__count--warn' : 'field__count--ok',
            ]"
          >
            {{ itemCount }} item{{ itemCount !== 1 ? "s" : "" }} (need
            {{ minRequired }}+)
          </span>
          <label class="upload-btn">
            <input
              type="file"
              accept=".csv,.txt,.json,application/json,text/json"
              class="sr-only"
              @change="handleFileUpload"
            />
            Import CSV / TXT / JSON
          </label>
        </div>
      </div>
    </div>

    <!-- Song review / edit panel -->
    <div v-if="editableSongs.length" class="song-review">
      <div class="song-review__header">
        <span class="song-review__title">Review &amp; Edit Songs</span>
        <span class="song-review__count">{{ editableSongs.length }} songs</span>
        <button class="link-btn" @click="clearEditableSongs">Clear</button>
      </div>
      <div class="song-review__list">
        <div class="song-review__col-labels">
          <span>Title</span>
          <span>Artist</span>
          <span></span>
        </div>
        <div
          v-for="(song, i) in editableSongs"
          :key="i"
          class="song-review__row"
        >
          <input
            v-model="song.text"
            type="text"
            class="song-review__input"
            placeholder="Song title"
          />
          <input
            v-model="song.sub"
            type="text"
            class="song-review__input song-review__input--artist"
            placeholder="Artist"
          />
          <button
            class="song-review__remove"
            title="Remove"
            @click="editableSongs.splice(i, 1)"
          >
            ×
          </button>
        </div>
      </div>
      <button class="song-review__add-btn" @click="addEditableSong">+ Add song</button>
    </div>

    <!-- Theme picker -->
    <div class="field">
      <label class="field__label">Theme</label>
      <div class="theme-options">
        <label
          v-for="t in themeList"
          :key="t.id"
          class="theme-btn"
          :class="{ 'theme-btn--active': selectedThemeId === t.id }"
        >
          <input type="radio" :value="t.id" v-model="selectedThemeId" class="sr-only" />

          <!-- Mini bingo card preview -->
          <span
            class="theme-preview"
            :style="{
              background: t.cardBg,
              border: t.cardBorder !== 'none' ? t.cardBorder : '1px solid #d1d5db',
              boxShadow: t.cardBoxShadow,
              borderRadius: t.cardBorderRadius !== '0' ? t.cardBorderRadius : '2px',
            }"
          >
            <!-- BINGO header row -->
            <span class="theme-preview__header-row">
              <span
                v-for="(letter, i) in ['B','I','N','G','O']"
                :key="letter"
                class="theme-preview__col-header"
                :style="{
                  background: t.colHeaderColors[i],
                  color: t.colHeaderColor,
                  fontFamily: t.colHeaderFontFamily,
                  fontWeight: t.colHeaderFontWeight,
                  letterSpacing: t.colHeaderLetterSpacing,
                }"
              >{{ letter }}</span>
            </span>
            <!-- 3 sample rows -->
            <span v-for="row in 3" :key="row" class="theme-preview__cell-row">
              <span
                v-for="col in 5"
                :key="col"
                class="theme-preview__cell"
                :style="row === 2 && col === 3 ? {
                  background: t.freeBg,
                  borderColor: t.freeBorderColor,
                  color: t.freeTextColor,
                } : {
                  background: t.cellBg === 'transparent' ? t.cardBg : t.cellBg,
                  borderColor: t.cellColBorderColors[(col - 1) % 5],
                  color: t.cellTextColor,
                }"
              >
                <template v-if="row === 2 && col === 3">
                  <span v-if="t.freeIcon" class="theme-preview__free-icon">{{ t.freeIcon }}</span>
                  <span v-else class="theme-preview__cell-line"></span>
                </template>
                <template v-else>
                  <span class="theme-preview__cell-line" :style="{ background: t.cellTextColor }"></span>
                  <span v-if="row !== 1 || col !== 2" class="theme-preview__cell-line theme-preview__cell-line--short" :style="{ background: t.cellSubColor }"></span>
                </template>
              </span>
            </span>
          </span>

          <span class="theme-btn__name">{{ t.name }}</span>
        </label>
      </div>
    </div>

    <!-- Header image -->
    <div class="field">
      <label class="toggle">
        <input
          v-model="useHeaderImage"
          type="checkbox"
          @change="onHeaderToggle"
        />
        <span class="toggle__track"></span>
        <span class="toggle__label">Header Image</span>
      </label>
      <template v-if="useHeaderImage">
        <label class="upload-btn upload-btn--image">
          <input
            type="file"
            accept="image/*"
            class="sr-only"
            @change="handleImageUpload"
          />
          {{ headerImageDataUrl ? "Change image…" : "Choose image…" }}
        </label>
        <div v-if="headerImageDataUrl" class="header-image-preview">
          <img :src="headerImageDataUrl" alt="Header preview" />
        </div>
        <p class="field__hint">Recommended size: 936 × 150 px</p>
      </template>
    </div>

    <!-- Paper size & orientation -->
    <div class="field">
      <label class="field__label">Paper Size</label>
      <div class="paper-size-options">
        <label
          v-for="opt in paperSizeOptions"
          :key="opt.value"
          class="paper-size-btn"
          :class="{ 'paper-size-btn--active': paperSize === opt.value }"
        >
          <input type="radio" :value="opt.value" v-model="paperSize" class="sr-only" />
          {{ opt.label }}
        </label>
      </div>
    </div>

    <!-- Options -->
    <div class="options-row">
      <div class="field field--inline">
        <label class="field__label">Pages to generate</label>
        <input
          v-model.number="pageCount"
          type="number"
          min="1"
          max="50"
          class="field__input field__input--short"
        />
      </div>

      <div class="field field--inline">
        <label class="field__label">Grid</label>
        <select v-model.number="gridSize" class="field__input field__input--short-grid">
          <option :value="4">4 x 4</option>
          <option :value="5">5 x 5</option>
        </select>
      </div>

      <div class="field field--inline">
        <label class="toggle">
          <input v-model="hasFreeSpace" type="checkbox" :disabled="!canUseFreeSpace" />
          <span class="toggle__track"></span>
          <span class="toggle__label">Free Space (5x5 only)</span>
        </label>
      </div>

      <div class="field field--inline">
        <label class="toggle">
          <input v-model="showBingoRow" type="checkbox" />
          <span class="toggle__track"></span>
          <span class="toggle__label">BINGO row</span>
        </label>
      </div>

      <div class="field field--inline">
        <label class="field__label">Font size</label>
        <div class="font-scale-control">
          <input
            v-model.number="fontScale"
            type="range"
            min="0.6"
            max="1.4"
            step="0.05"
            class="font-scale-control__slider"
          />
          <span class="font-scale-control__value">{{ fontSizeEstimatePx }}px est</span>
        </div>
      </div>
    </div>

    <div v-if="csvColumns.length > 1" class="csv-columns-picker">
      <p class="field__hint field__hint--block">
        CSV detected {{ csvColumns.length }} columns — map them below.
      </p>
      <div class="csv-col-row">
        <div class="field">
          <label class="field__label">Song / Text column</label>
          <select
            v-model="selectedColumn"
            class="field__input"
            @change="syncColumnsFromCsv"
          >
            <option v-for="col in csvColumns" :key="col" :value="col">
              {{ col }}
            </option>
          </select>
        </div>
      </div>
      <div class="field">
        <label class="field__label"
          >Artist / Subtitle column
          <span class="field__hint">(optional)</span></label
        >
        <select
          v-model="artistColumn"
          class="field__input"
          @change="syncColumnsFromCsv"
        >
          <option value="">(none)</option>
          <option v-for="col in csvColumns" :key="col" :value="col">
            {{ col }}
          </option>
        </select>
      </div>
    </div>

    <button
      class="generate-btn"
      :disabled="itemCount < minRequired"
      @click="emitGenerate"
    >
      Generate {{ pageCount }} Page{{ pageCount !== 1 ? "s" : "" }}
    </button>
  </div>

  <SpotifyPlaylistPicker
    :open="showPlaylistPicker"
    :token="spotifyToken"
    @close="showPlaylistPicker = false"
    @select="onPickerSelect"
  />
</template>

<script setup>
import { ref, computed, watch } from "vue";
import Papa from "papaparse";
import { THEME_LIST, DEFAULT_THEME } from "../themes/index.js";
import {
  startSpotifyAuth,
  clearSpotifyAuth,
  getStoredToken,
  parsePlaylistId,
  fetchPlaylistTracks,
  fetchPlaylistName,
  hasClientId,
} from "../composables/useSpotify.js";
import { CELL_TEXT_LIMIT } from "../composables/useBingoCards.js";
import SpotifyPlaylistPicker from "./SpotifyPlaylistPicker.vue";

const emit = defineEmits([
  "generate",
  "theme-change",
  "title-change",
  "header-image-change",
  "show-bingo-row-change",
  "grid-size-change",
  "font-scale-change",
  "free-space-change",
  "spotify-connected",
]);

const props = defineProps({
  spotifyToken: { type: String, default: null },
  defaultHeaderImage: { type: String, default: "" },
});

const rawText = ref("");
const cardTitle = ref("Music Bingo");
const pageCount = ref(1);
const gridSize = ref(5);
const hasFreeSpace = ref(false);
const showBingoRow = ref(false);
const SLIDER_DEFAULT = 1;
const FIT_BASE_SCALE = 1;
const fontScale = ref(SLIDER_DEFAULT);
const useHeaderImage = ref(Boolean(props.defaultHeaderImage));
const headerImageDataUrl = ref(props.defaultHeaderImage || "");
const csvColumns = ref([]);
const selectedColumn = ref("");
const artistColumn = ref("");
const parsedCsvRows = ref([]);
const csvItems = ref([]); // { text, sub }[] populated when a CSV is loaded
const editableSongs = ref([]); // user-editable copy after import

// Spotify
const clientIdConfigured = hasClientId();
const playlistUrl        = ref("");
const spotifyLoading     = ref(false);
const spotifyError       = ref("");
const showPlaylistPicker = ref(false);

async function connectSpotify() {
  try {
    await startSpotifyAuth({ usePopup: false });
    emit("spotify-connected", getStoredToken());
  } catch (e) {
    spotifyError.value = e?.message || "Spotify authorization failed.";
  }
}

function disconnectSpotify() {
  clearSpotifyAuth();
  emit("spotify-connected", null);
}

async function importPlaylistById(id, knownName = '') {
  const [tracks, name] = await Promise.all([
    fetchPlaylistTracks(id, props.spotifyToken),
    knownName ? Promise.resolve(knownName) : fetchPlaylistName(id, props.spotifyToken),
  ]);
  if (!tracks.length) throw new Error("No tracks found in that playlist.");
  csvItems.value = tracks;
  editableSongs.value = tracks.map(t => ({ text: t.text, sub: t.sub || "" }));
  rawText.value = tracks.map(t => t.sub ? `${t.text} - ${t.sub}` : t.text).join("\n");
  csvColumns.value = [];
  if (name) cardTitle.value = name;
}

async function importPlaylist() {
  spotifyError.value = "";
  const id = parsePlaylistId(playlistUrl.value.trim());
  if (!id) {
    spotifyError.value = "Invalid Spotify playlist URL.";
    return;
  }
  spotifyLoading.value = true;
  try {
    await importPlaylistById(id);
    playlistUrl.value = "";
  } catch (e) {
    spotifyError.value = e.message;
  } finally {
    spotifyLoading.value = false;
  }
}

async function onPickerSelect({ id, name }) {
  showPlaylistPicker.value = false;
  spotifyError.value = "";
  spotifyLoading.value = true;
  try {
    await importPlaylistById(id, name);
  } catch (e) {
    spotifyError.value = e.message;
  } finally {
    spotifyLoading.value = false;
  }
}

// Theme
const themeList = THEME_LIST
const selectedThemeId = ref(DEFAULT_THEME.id)

watch(selectedThemeId, (id) => {
  emit('theme-change', THEME_LIST.find(t => t.id === id) ?? DEFAULT_THEME)
})

watch(cardTitle, (val) => {
  emit('title-change', val.trim())
}, { immediate: true })

watch(
  showBingoRow,
  (v) => {
    emit("show-bingo-row-change", v);
  },
  { immediate: true }
);

watch(
  gridSize,
  (v) => {
    if (Number(v) === 4) hasFreeSpace.value = false;
    emit("grid-size-change", v);
  },
  { immediate: true }
);

watch(
  hasFreeSpace,
  (v) => {
    emit("free-space-change", Boolean(v));
  },
  { immediate: true }
);

watch(
  fontScale,
  (v) => {
    emit("font-scale-change", toEffectiveFontScale(v));
  },
  { immediate: true }
);

function toEffectiveFontScale(value) {
  const sliderValue = Number(value) || SLIDER_DEFAULT;
  return sliderValue * FIT_BASE_SCALE;
}

const fontSizeEstimatePx = computed(() =>
  Math.round(16 * toEffectiveFontScale(fontScale.value)),
);

// Paper size / orientation
const paperSize = ref("letter");
const orientation = "landscape";

const paperSizeOptions = [
  { value: "letter", label: '8.5 × 11"' },
];

const canUseFreeSpace = computed(() => gridSize.value === 5);

const minRequired = computed(() => {
  const total = gridSize.value * gridSize.value;
  const includeFree = canUseFreeSpace.value && hasFreeSpace.value;
  return includeFree ? total - 1 : total;
});

const items = computed(() => {
  // When editable songs are loaded (from any import), use those
  if (editableSongs.value.length) return editableSongs.value.filter(s => s.text.trim());

  // When a CSV is loaded without review panel, use the structured csvItems directly
  if (csvItems.value.length) return csvItems.value;

  // Otherwise parse the textarea — support "Song - Artist" format
  const text = rawText.value.trim();
  if (!text) return [];
  return text
    .split(/[\n,]+/)
    .map((s) => {
      const trimmed = s.trim();
      if (!trimmed) return null;
      const dashIdx = trimmed.indexOf(" - ");
      if (dashIdx === -1) return { text: trimmed, sub: "" };
      return {
        text: trimmed.slice(0, dashIdx).trim(),
        sub: trimmed.slice(dashIdx + 3).trim(),
      };
    })
    .filter(Boolean);
});

const itemCount = computed(() => items.value.length);

function syncFromText() {
  // When user types, discard any loaded CSV/import state
  csvColumns.value = [];
  parsedCsvRows.value = [];
  selectedColumn.value = "";
  artistColumn.value = "";
  csvItems.value = [];
  editableSongs.value = [];
}

function normalizeImportedItems(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      if (typeof row === "string") {
        const text = row.trim();
        return text ? { text, sub: "" } : null;
      }
      if (!row || typeof row !== "object") return null;
      const text = String(row.text ?? row.name ?? row.title ?? "").trim();
      const sub = String(row.sub ?? row.artist ?? row.by ?? "").trim();
      if (!text) return null;
      return { text, sub };
    })
    .filter(Boolean);
}

function applyImportedItems(nextItems) {
  csvColumns.value = [];
  parsedCsvRows.value = [];
  selectedColumn.value = "";
  artistColumn.value = "";
  csvItems.value = normalizeImportedItems(nextItems);
  editableSongs.value = csvItems.value.map(item => ({ text: item.text, sub: item.sub }));
  rawText.value = csvItems.value
    .map((item) => (item.sub ? `${item.text} - ${item.sub}` : item.text))
    .join("\n");
}

async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = ""; // reset so same file can be re-selected

  const name = String(file.name || "").toLowerCase();
  const isJson = name.endsWith(".json") || file.type.includes("json");

  if (isJson) {
    try {
      const parsed = JSON.parse(await file.text());
      const rows = Array.isArray(parsed) ? parsed : parsed?.tracks;
      applyImportedItems(rows);
      const importedTitle = String(parsed?.title ?? "").trim();
      if (importedTitle) cardTitle.value = importedTitle;
    } catch {
      // Ignore invalid JSON; leave state as-is.
    }
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete(results) {
      if (!results.data.length) return;

      parsedCsvRows.value = results.data;
      const cols = results.meta.fields || [];
      csvColumns.value = cols;
      selectedColumn.value = cols[0] || "";
      // Auto-detect an artist/subtitle column by common header names
      const artistGuess = cols.find((c) =>
        /artist|author|subtitle|sub|by/i.test(c),
      );
      artistColumn.value = artistGuess || (cols.length > 1 ? cols[1] : "");

      syncColumnsFromCsv();
    },
  });
}

function syncColumnsFromCsv() {
  if (!selectedColumn.value || !parsedCsvRows.value.length) return;
  csvItems.value = parsedCsvRows.value
    .map((row) => ({
      text: String(row[selectedColumn.value] || "").trim(),
      sub: artistColumn.value
        ? String(row[artistColumn.value] || "").trim()
        : "",
    }))
    .filter((item) => item.text);
  editableSongs.value = csvItems.value.map(item => ({ text: item.text, sub: item.sub }));
  // Keep rawText in sync for display (text column only)
  rawText.value = csvItems.value
    .map((item) => (item.sub ? `${item.text} - ${item.sub}` : item.text))
    .join("\n");
}

function onHeaderToggle() {
  if (!useHeaderImage.value) headerImageDataUrl.value = "";
  emitHeaderImageChange();
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = "";
  const reader = new FileReader();
  reader.onload = (ev) => {
    headerImageDataUrl.value = ev.target.result;
    emitHeaderImageChange();
  };
  reader.readAsDataURL(file);
}

function emitHeaderImageChange() {
  emit("header-image-change", useHeaderImage.value ? headerImageDataUrl.value : "");
}

watch(
  () => props.defaultHeaderImage,
  (next) => {
    if (next && !headerImageDataUrl.value) {
      headerImageDataUrl.value = next;
      useHeaderImage.value = true;
    }
    emitHeaderImageChange();
  },
  { immediate: true },
);

function emitGenerate() {
  const pages = Math.min(50, Math.max(1, Number(pageCount.value) || 1));
  emit("generate", {
    items: items.value,
    count: pages * 2,
    gridSize: gridSize.value,
    hasFreeSpace: canUseFreeSpace.value && hasFreeSpace.value,
    showBingoRow: showBingoRow.value,
    fontScale: toEffectiveFontScale(fontScale.value),
    title: cardTitle.value.trim(),
    headerImage: useHeaderImage.value ? headerImageDataUrl.value : "",
    paperSize: paperSize.value,
    orientation: orientation.value,
    autoExportPdf: true,
    theme: THEME_LIST.find(t => t.id === selectedThemeId.value) ?? DEFAULT_THEME,
    songList: editableSongs.value.length
      ? { title: cardTitle.value.trim(), tracks: editableSongs.value.filter(s => s.text.trim()).map(s => ({ title: s.text.trim(), artist: s.sub.trim() })) }
      : null,
  });
}

function clearEditableSongs() {
  editableSongs.value = [];
  csvItems.value = [];
  rawText.value = "";
  csvColumns.value = [];
  parsedCsvRows.value = [];
}

function addEditableSong() {
  editableSongs.value.push({ text: "", sub: "" });
}
</script>

<style scoped>
.input-panel {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-panel__heading {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field--inline {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.field__label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
}

.field__hint {
  font-weight: 400;
  color: #9ca3af;
  font-size: 12px;
}

.field__hint--block {
  font-size: 12px;
  color: #6b7280;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 8px 10px;
}

.field__input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
  color: #1e293b;
  outline: none;
  transition: border-color 0.15s;
}

.field__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.field__input--short {
  width: 70px;
  text-align: center;
}

.field__input--short-grid {
  width: 92px;
}

.field__textarea {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 10px;
  font-size: 13px;
  color: #1e293b;
  resize: vertical;
  outline: none;
  line-height: 1.5;
  transition: border-color 0.15s;
}

.field__textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.field__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field__meta--stacked {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.field__meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.field__meta-note {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: #64748b;
}

.field__count {
  font-size: 12px;
  font-weight: 600;
}

.field__count--warn {
  color: #dc2626;
}
.field__count--ok {
  color: #059669;
}

.upload-btn {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  padding: 4px 10px;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  background: #eff6ff;
  transition: background 0.15s;
}

.upload-btn:hover {
  background: #dbeafe;
}

.upload-btn--image {
  display: inline-block;
  margin-top: 6px;
}

.header-image-preview {
  margin-top: 6px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  height: 75px;
}

.header-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.options-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.toggle input {
  display: none;
}

.toggle__track {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: #d1d5db;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle__track::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle input:checked ~ .toggle__track {
  background: #2563eb;
}

.toggle input:checked ~ .toggle__track::after {
  transform: translateX(16px);
}

.toggle__label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.generate-btn {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: background 0.15s, opacity 0.15s;
  margin-top: 4px;
}

.generate-btn:hover:not(:disabled) {
  background: #1d4ed8;
}
.generate-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.csv-columns-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.csv-col-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.link-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  padding: 0 4px;
  cursor: pointer;
  text-decoration: underline;
}

.font-scale-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.font-scale-control__slider {
  width: 130px;
}

.font-scale-control__value {
  min-width: 44px;
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
}

/* Theme picker */
.theme-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.theme-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 8px;
  border: 2px solid #d1d5db;
  border-radius: 10px;
  background: #f9fafb;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

.theme-btn:hover {
  border-color: #93c5fd;
  background: #f0f9ff;
}

.theme-btn--active {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
}

/* Mini card preview */
.theme-preview {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  flex-shrink: 0;
}

.theme-preview__header-row {
  display: flex;
}

.theme-preview__col-header {
  flex: 1;
  text-align: center;
  font-size: 8px;
  padding: 3px 0;
  line-height: 1;
}

.theme-preview__cell-row {
  display: flex;
  border-top: 1px solid rgba(0,0,0,.1);
}

.theme-preview__cell {
  flex: 1;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-left: 2px solid transparent;
  gap: 2px;
  padding: 3px 2px;
}

.theme-preview__cell:first-child {
  border-left: none;
}

.theme-preview__free-icon {
  font-size: 9px;
  line-height: 1;
}

.theme-preview__cell-line {
  display: block;
  width: 70%;
  height: 2px;
  border-radius: 1px;
  opacity: 0.55;
}

.theme-preview__cell-line--short {
  width: 50%;
  opacity: 0.35;
}

.theme-btn__name {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

/* Paper size selector */
.paper-size-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.paper-size-btn {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  padding: 6px 8px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: normal;
  line-height: 1.2;
}

.paper-size-btn:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

.paper-size-btn--active {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1d4ed8;
}

/* Orientation selector */
.orientation-options {
  display: flex;
  gap: 8px;
}

.orientation-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  padding: 7px 14px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.orientation-btn:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

.orientation-btn--active {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1d4ed8;
}

/* ── Song review panel ─────────────────────────────────── */
.song-review {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1.5px solid #bfdbfe;
  border-radius: 10px;
  background: #f0f9ff;
  padding: 14px;
}

.song-review__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.song-review__title {
  font-size: 13px;
  font-weight: 700;
  color: #1e3a5f;
  flex: 1;
}

.song-review__count {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 600;
}

.song-review__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 280px;
  overflow-y: auto;
}

.song-review__col-labels {
  display: grid;
  grid-template-columns: 1fr 1fr 24px;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  padding: 0 2px;
}

.song-review__row {
  display: grid;
  grid-template-columns: 1fr 1fr 24px;
  gap: 4px;
  align-items: center;
}

.song-review__input {
  border: 1px solid #d1d5db;
  border-radius: 5px;
  padding: 5px 8px;
  font-size: 12px;
  color: #1e293b;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
  min-width: 0;
}

.song-review__input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.song-review__remove {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}

.song-review__remove:hover {
  color: #dc2626;
  background: #fee2e2;
}

.song-review__add-btn {
  background: none;
  border: 1px dashed #93c5fd;
  border-radius: 6px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  text-align: left;
}

.song-review__add-btn:hover {
  background: #dbeafe;
  border-color: #3b82f6;
}

/* ── Spotify section ───────────────────────────────────── */
.spotify-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 10px;
  padding: 14px;
}

.spotify-section__header {
  display: flex;
  align-items: center;
  gap: 7px;
}

.spotify-section__title {
  font-size: 13px;
  font-weight: 700;
  color: #14532d;
  flex: 1;
}

.spotify-section__desc {
  font-size: 12px;
  color: #166534;
  margin: 0;
}

.spotify-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1db954;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  align-self: flex-start;
}
.spotify-btn:hover:not(:disabled) { background: #1aa34a; }
.spotify-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spotify-btn--sm {
  border-radius: 6px;
  padding: 7px 12px;
  flex-shrink: 0;
  align-self: auto;
}

.spotify-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #1db954;
  margin-left: auto;
}
.spotify-status__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1db954;
}

.spotify-browse-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  align-self: stretch;
  justify-content: center;
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 13px;
}

.spotify-url-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.spotify-url-row .field__input {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  background: #fff;
}

.spotify-error {
  font-size: 12px;
  color: #dc2626;
  margin: 0;
}

</style>
