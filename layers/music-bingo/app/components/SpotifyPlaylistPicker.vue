<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="spp-backdrop"
      @click.self="$emit('close')"
      @keydown.esc="$emit('close')"
    >
      <div class="spp-modal" role="dialog" aria-modal="true" aria-label="Choose Spotify Playlist">
        <!-- Header -->
        <div class="spp-header">
          <div class="spp-header__title-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1db954" flex-shrink="0">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span class="spp-header__title">Choose Spotify Playlist</span>
          </div>
          <button class="spp-close" aria-label="Close" @click="$emit('close')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Search -->
        <div class="spp-search">
          <svg class="spp-search__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref="searchInputRef"
            v-model="query"
            type="search"
            class="spp-search__input"
            placeholder="Filter playlists…"
            autocomplete="off"
            spellcheck="false"
          />
          <button
            v-if="query"
            class="spp-search__clear"
            aria-label="Clear filter"
            @click="query = ''"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="spp-body">
          <!-- Loading -->
          <div v-if="loading" class="spp-state">
            <span class="spp-spinner"></span>
            <span>Loading playlists…</span>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="spp-state spp-state--error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ error }}</span>
            <button class="spp-retry-btn" @click="load">Retry</button>
          </div>

          <!-- Empty filter result -->
          <div v-else-if="filtered.length === 0" class="spp-state">
            <span>No playlists match "{{ query }}"</span>
          </div>

          <!-- Playlist grid -->
          <div v-else class="spp-grid">
            <button
              v-for="pl in visiblePlaylists"
              :key="pl.id"
              class="spp-item"
              :class="{ 'spp-item--loading': importingId === pl.id }"
              :disabled="importingId !== null"
              @click="select(pl)"
            >
              <!-- Cover art -->
              <div class="spp-item__art">
                <img
                  v-if="coverUrl(pl)"
                  :src="coverUrl(pl)"
                  :alt="pl.name"
                  class="spp-item__img"
                  loading="lazy"
                />
                <span v-else class="spp-item__art-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  </svg>
                </span>
                <div v-if="importingId === pl.id" class="spp-item__loading-overlay">
                  <span class="spp-spinner spp-spinner--sm"></span>
                </div>
              </div>
              <!-- Info -->
              <div class="spp-item__info">
                <span class="spp-item__name">{{ pl.name }}</span>
                <span class="spp-item__meta">{{ pl.trackTotal ?? '—' }} tracks</span>
              </div>
            </button>
          </div>

          <!-- Load more / show all toggle -->
          <div v-if="!loading && !error && filtered.length > DEFAULT_VISIBLE" class="spp-load-more">
            <button v-if="!showAll" class="spp-load-more__btn" @click="showAll = true">
              Show all {{ filtered.length }} playlists
            </button>
            <span v-else class="spp-load-more__label">Showing all {{ filtered.length }} playlists</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { fetchUserPlaylists, fetchPlaylistMeta, playlistSpecifiedCoverImageUrl } from '../composables/useSpotify.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  token: { type: String, default: null },
})

const emit = defineEmits(['close', 'select'])

const DEFAULT_VISIBLE = 10

const query = ref('')
const allPlaylists = ref([])
const loading = ref(false)
const error = ref('')
const importingId = ref(null)
const showAll = ref(false)
const searchInputRef = ref(null)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allPlaylists.value
  return allPlaylists.value.filter(pl =>
    pl.name?.toLowerCase().includes(q)
  )
})

const visiblePlaylists = computed(() =>
  showAll.value ? filtered.value : filtered.value.slice(0, DEFAULT_VISIBLE)
)

watch(() => props.open, async (isOpen) => {
  if (!isOpen) return
  query.value = ''
  showAll.value = false
  await load()
  await nextTick()
  searchInputRef.value?.focus()
})

// Reset showAll when filter changes so user sees top results first
watch(query, () => { showAll.value = false })

async function load() {
  if (!props.token) {
    error.value = 'Not connected to Spotify.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const result = await fetchUserPlaylists(props.token, 50, 0)
    // Normalize each item so trackTotal is always a top-level field.
    // Spotify simplified playlist objects include tracks: { href, total } but
    // some playlist types (algorithmic, followed) return tracks: null.
    allPlaylists.value = result.items.map(pl => {
      const total = pl.items?.total ?? pl.tracks?.total
      return { ...pl, trackTotal: typeof total === 'number' ? total : null }
    })
    const needsCounts = allPlaylists.value.filter(pl => pl.trackTotal === null)
    if (needsCounts.length > 0) {
      fetchMissingTrackCounts(needsCounts)
    }
  } catch (e) {
    error.value = e?.message || 'Failed to load playlists.'
  } finally {
    loading.value = false
  }
}

async function fetchMissingTrackCounts(playlists) {
  const BATCH = 10
  for (let i = 0; i < playlists.length; i += BATCH) {
    const batch = playlists.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      batch.map(pl => fetchPlaylistMeta(pl.id, props.token))
    )
    results.forEach((result, j) => {
      if (result.status !== 'fulfilled') return
      const total = result.value?.items?.total ?? result.value?.tracks?.total
      const idx = allPlaylists.value.findIndex(p => p.id === batch[j].id)
      if (idx !== -1) {
        allPlaylists.value[idx] = {
          ...allPlaylists.value[idx],
          trackTotal: typeof total === 'number' ? total : null,
        }
      }
    })
  }
}

async function select(playlist) {
  importingId.value = playlist.id
  try {
    emit('select', { id: playlist.id, name: playlist.name })
  } finally {
    importingId.value = null
  }
}

function coverUrl(playlist) {
  return playlistSpecifiedCoverImageUrl(playlist)
}
</script>

<style scoped>
.spp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.spp-modal {
  background: #161b26;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6);
  width: 100%;
  max-width: 620px;
  max-height: min(80vh, 720px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.spp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.spp-header__title-row {
  display: flex;
  align-items: center;
  gap: 9px;
}

.spp-header__title {
  font-size: 15px;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.01em;
}

.spp-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.spp-close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #f1f5f9;
}

/* Search */
.spp-search {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
  gap: 10px;
}

.spp-search__icon {
  color: #64748b;
  flex-shrink: 0;
}

.spp-search__input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 14px;
  color: #f1f5f9;
  caret-color: #1db954;
}

.spp-search__input::placeholder {
  color: #475569;
}

.spp-search__input::-webkit-search-cancel-button {
  display: none;
}

.spp-search__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.spp-search__clear:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
}

/* Body */
.spp-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* State (loading / error / empty) */
.spp-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 24px;
  color: #64748b;
  font-size: 13px;
  text-align: center;
}

.spp-state--error {
  color: #f87171;
}

.spp-retry-btn {
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 6px;
  color: #f87171;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.spp-retry-btn:hover {
  background: rgba(248, 113, 113, 0.2);
}

/* Spinner */
.spp-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.12);
  border-top-color: #1db954;
  border-radius: 50%;
  animation: spp-spin 0.7s linear infinite;
  flex-shrink: 0;
}

.spp-spinner--sm {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spp-spin {
  to { transform: rotate(360deg); }
}

/* Playlist grid */
.spp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
}

.spp-item {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1.5px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s, transform 0.12s;
  padding: 0;
}

.spp-item:hover:not(:disabled) {
  border-color: #1db954;
  background: rgba(29, 185, 84, 0.06);
  transform: translateY(-1px);
}

.spp-item:disabled {
  cursor: default;
  opacity: 0.7;
}

.spp-item--loading {
  border-color: #1db954;
}

/* Art */
.spp-item__art {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: #1e2433;
  overflow: hidden;
  flex-shrink: 0;
}

.spp-item__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.spp-item__art-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #334155;
}

.spp-item__loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Info */
.spp-item__info {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.spp-item__name {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.spp-item__meta {
  font-size: 11px;
  color: #64748b;
}

/* Load more */
.spp-load-more {
  display: flex;
  justify-content: center;
  padding: 4px 0 2px;
}

.spp-load-more__btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 18px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.spp-load-more__btn:hover {
  border-color: #1db954;
  color: #1db954;
  background: rgba(29, 185, 84, 0.06);
}

.spp-load-more__label {
  font-size: 12px;
  color: #475569;
}
</style>
