<template>
  <div
    class="local-layout flex min-h-full min-w-0 flex-1 flex-col bg-[#0b0e14] text-zinc-100"
  >
    <LocalHeader
      title="Manage Playlists"
      subtitle="Import from Spotify, CSV, or YouTube, edit song titles, and save for offline use."
    >
      <RouterLink
        :to="{ name: 'mb-home' }"
        class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
      >
        <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to Local
      </RouterLink>
    </LocalHeader>

    <main class="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        class="mx-auto flex w-full max-w-[900px] flex-1 flex-col px-4 pb-8 pt-8 md:px-6"
      >

        <!-- ── Phase: pick ── -->
        <div v-if="phase === 'pick'" class="flex flex-1 flex-col gap-8">

          <div class="flex gap-6 items-start">

            <!-- Saved playlists -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-white">Your Playlists</h2>
                <div class="flex items-center gap-3">
                  <button
                    v-if="savedPlaylists.some(p => p.spotifyPlaylistUrl)"
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c084fc] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="syncBusy"
                    @click="syncAllPlaylists"
                  >
                    <svg class="h-3.5 w-3.5 shrink-0" :class="{ 'animate-spin': syncBusy }" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    {{ syncBusy ? 'Syncing…' : 'Sync with Spotify' }}
                  </button>
                  <span class="text-xs text-[#64748b]">{{ savedPlaylists.length }} playlist{{ savedPlaylists.length !== 1 ? 's' : '' }}</span>
                </div>
              </div>
              <div v-if="savedPlaylists.length === 0" class="rounded-xl border border-white/[0.06] bg-[#0f1219]/60 px-6 py-10 text-center text-sm text-[#64748b]">
                No playlists saved yet. Add one from Spotify.
              </div>
              <ul class="grid grid-cols-3 gap-4">
                <li
                  v-for="playlist in savedPlaylists"
                  :key="playlist.id"
                  class="playlist-list-item relative flex flex-col"
                  :class="{ 'playlist-list-item--syncing': syncState[playlist.id] === 'syncing' }"
                >
                <RouterLink
                  :to="{ name: 'mb-playlists-id', params: { id: playlist.id } }"
                  class="flex flex-1 flex-col overflow-hidden rounded-xl border border-white/8 bg-[#0f1219]/90 no-underline transition hover:border-[#a855f7]/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                  :aria-disabled="syncState[playlist.id] === 'syncing' ? 'true' : undefined"
                  :tabindex="syncState[playlist.id] === 'syncing' ? -1 : undefined"
                >
                  <div class="aspect-square relative w-full overflow-hidden bg-[#a855f7]/15">
                    <img
                      v-if="resolvePlaylistImage(playlist.image)"
                      :src="resolvePlaylistImage(playlist.image)"
                      :alt="playlist.title"
                      class="h-full w-full object-cover"
                    />
                    <div v-else class="flex h-full w-full items-center justify-center">
                      <svg class="h-10 w-10 text-[#a855f7]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.75"/>
                        <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="1.75"/>
                      </svg>
                    </div>
                    <!-- Done badge -->
                    <span v-if="syncState[playlist.id] === 'done'" class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-lg" aria-label="Synced">
                      <svg class="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <!-- Error badge -->
                    <span v-else-if="syncState[playlist.id] === 'error'" class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 shadow-lg" aria-label="Sync failed">
                      <svg class="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                      </svg>
                    </span>
                  </div>
                  <div class="p-3">
                    <p class="truncate text-sm font-semibold text-white">{{ playlist.title }}</p>
                    <p class="mt-0.5 text-xs" :class="syncState[playlist.id] === 'error' ? 'text-rose-400' : 'text-[#64748b]'">
                      {{ syncState[playlist.id] === 'syncing' ? 'Syncing…' : syncState[playlist.id] === 'done' ? 'Synced' : syncState[playlist.id] === 'error' ? 'Sync failed' : playlist.tracks.length + ' tracks' }}
                    </p>
                  </div>
                </RouterLink>
                <div
                  v-if="syncState[playlist.id] === 'syncing'"
                  class="playlist-sync-overlay"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <span class="sync-spinner" aria-hidden="true" />
                  <span class="playlist-sync-overlay__label">Syncing…</span>
                </div>
                </li>
              </ul>
            </div>

            <!-- Add playlist panel -->
            <div class="w-72 shrink-0 rounded-xl border border-white/[0.08] bg-[#0f1219]/60 px-5 py-5">
              <p class="mb-4 text-sm font-semibold text-white">Add a Playlist</p>

              <!-- Source tabs -->
              <div class="mb-4 flex gap-1.5 rounded-lg border border-white/10 bg-black/20 p-1">
                <button
                  v-for="tab in addTabs"
                  :key="tab.id"
                  type="button"
                  class="flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition"
                  :class="addTab === tab.id
                    ? 'bg-[#a855f7]/25 text-white'
                    : 'text-[#9ca3af] hover:bg-white/5 hover:text-white'"
                  @click="addTab = tab.id"
                >
                  {{ tab.label }}
                </button>
              </div>

              <!-- Spotify -->
              <div v-if="addTab === 'spotify'">
                <p class="mb-3 text-xs text-[#9ca3af]">Import tracks from any of your Spotify playlists.</p>
                <div v-if="!spotifyClientConfigured" class="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 text-center">
                  Spotify is not configured. Set
                  <code class="rounded bg-black/30 px-1 py-0.5 text-xs font-mono">NUXT_PUBLIC_SPOTIFY_CLIENT_ID</code>
                  in your environment to use this feature.
                </div>

                <template v-else>
                  <div v-if="!spotifyToken" class="flex flex-col gap-3">
                    <button
                      type="button"
                      class="spotify-connect-btn inline-flex w-full items-center justify-center gap-3 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="authBusy"
                      @click="connectSpotify"
                    >
                      <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      {{ authBusy ? 'Opening Spotify…' : 'Connect Spotify' }}
                    </button>
                    <p v-if="authError" class="text-sm text-rose-300">{{ authError }}</p>
                  </div>

                  <div v-else class="flex flex-col gap-3">
                    <p class="flex items-center gap-2 text-sm text-emerald-300/95">
                      <span class="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                      Spotify connected
                    </p>
                    <button
                      type="button"
                      class="spotify-connect-btn inline-flex w-full items-center justify-center gap-3 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
                      @click="pickerOpen = true"
                    >
                      <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Add Spotify Playlist
                    </button>
                  </div>
                </template>
              </div>

              <!-- CSV -->
              <div v-else-if="addTab === 'csv'">
                <p class="mb-3 text-xs text-[#9ca3af]">Upload a CSV file with song title (and optionally artist) columns.</p>
                <label
                  class="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-center transition hover:border-[#a855f7]/50 hover:bg-white/5"
                >
                  <svg class="h-6 w-6 text-[#a855f7]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="text-xs font-semibold text-white">{{ csvFileName || 'Choose a CSV file…' }}</span>
                  <input type="file" accept=".csv,text/csv" class="hidden" @change="handleCsvFile" />
                </label>

                <div v-if="csvColumns.length" class="mt-3 flex flex-col gap-2">
                  <label class="flex flex-col gap-1 text-xs text-[#9ca3af]">
                    Title column
                    <select v-model="csvTitleColumn" class="rounded-lg border border-white/10 bg-[#0b0e14] px-2 py-1.5 text-sm text-white outline-none focus:border-[#a855f7]/60">
                      <option v-for="c in csvColumns" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </label>
                  <label class="flex flex-col gap-1 text-xs text-[#9ca3af]">
                    Artist column (optional)
                    <select v-model="csvArtistColumn" class="rounded-lg border border-white/10 bg-[#0b0e14] px-2 py-1.5 text-sm text-white outline-none focus:border-[#a855f7]/60">
                      <option value="">None</option>
                      <option v-for="c in csvColumns" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    class="local-btn local-btn--gradient mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                    @click="importCsv"
                  >
                    Import {{ csvRows.length }} row{{ csvRows.length !== 1 ? 's' : '' }}
                  </button>
                </div>
                <p v-if="csvError" class="mt-2 text-sm text-rose-300">{{ csvError }}</p>
              </div>

              <!-- YouTube -->
              <div v-else-if="addTab === 'youtube'">
                <p class="mb-3 text-xs text-[#9ca3af]">Import video titles from a public YouTube playlist.</p>
                <div v-if="!youtubeConfigured" class="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 text-center">
                  YouTube is not configured. Set
                  <code class="rounded bg-black/30 px-1 py-0.5 text-xs font-mono">NUXT_PUBLIC_YOUTUBE_API_KEY</code>
                  in your environment to use this feature.
                </div>
                <template v-else>
                  <input
                    v-model="youtubeUrl"
                    type="text"
                    placeholder="Playlist URL or ID…"
                    class="w-full rounded-lg border border-white/10 bg-[#0b0e14] px-3 py-2 text-sm text-white outline-none focus:border-[#a855f7]/60 transition"
                  />
                  <button
                    type="button"
                    class="local-btn local-btn--gradient mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="youtubeBusy || !youtubeUrl.trim()"
                    @click="importYoutube"
                  >
                    {{ youtubeBusy ? 'Fetching…' : 'Fetch Playlist' }}
                  </button>
                  <p v-if="youtubeError" class="mt-2 text-sm text-rose-300">{{ youtubeError }}</p>
                </template>
              </div>
            </div>

          </div>

        </div>

        <!-- ── Phase: loading ── -->
        <div v-else-if="phase === 'loading'" class="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <span class="loading-spinner" aria-hidden="true" />
          <p class="text-[#9ca3af] text-sm">Loading tracks from <span class="text-white font-semibold">{{ loadingPlaylistName }}</span>…</p>
        </div>

        <!-- ── Phase: error ── -->
        <div v-else-if="phase === 'error'" class="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <div class="rounded-xl border border-rose-500/35 bg-rose-500/10 px-6 py-5 max-w-md w-full">
            <p class="text-rose-300 font-semibold mb-1">Failed to load tracks</p>
            <p class="text-rose-200/70 text-sm">{{ fetchError }}</p>
          </div>
          <button
            type="button"
            class="local-btn local-btn--outline-muted rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:bg-white/5"
            @click="resetToPick"
          >
            Try again
          </button>
        </div>

        <!-- ── Phase: review ── -->
        <div v-else-if="phase === 'review'" class="flex flex-1 flex-col gap-6">
          <!-- Playlist header -->
          <div class="flex flex-wrap items-start gap-4 rounded-xl border border-white/[0.08] bg-[#0f1219]/90 p-5">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold uppercase tracking-widest text-[#c084fc] mb-1">Playlist</p>
              <input
                v-model="playlistTitle"
                type="text"
                class="w-full rounded-lg border border-white/10 bg-[#0b0e14] px-3 py-2 text-lg font-bold text-white outline-none focus:border-[#a855f7]/60 transition"
                placeholder="Playlist title…"
              />
              <p class="mt-1.5 text-xs text-[#64748b]">
                <a
                  v-if="sourceUrl"
                  :href="sourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[#c084fc] underline decoration-[#a855f7]/40 underline-offset-2 hover:text-fuchsia-300"
                >
                  {{ importSource === 'youtube' ? 'View on YouTube' : 'View on Spotify' }}
                </a>
                <template v-if="sourceUrl">· </template>{{ editableTracks.length }} tracks
              </p>
            </div>
            <div class="flex shrink-0 gap-2 flex-wrap">
              <button
                type="button"
                class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                @click="resetToPick"
              >
                Change playlist
              </button>
              <button
                type="button"
                class="local-btn local-btn--gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="saveBusy"
                @click="savePlaylist"
              >
                <svg v-if="!saveSuccess" class="h-4 w-4 shrink-0" :class="{ 'animate-spin': saveBusy }" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path v-if="saveBusy" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                  <path v-else d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2M7 11l5 5 5-5M12 4v12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else class="h-4 w-4 shrink-0 text-emerald-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ saveBusy ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save Playlist' }}
              </button>
            </div>
          </div>

          <!-- Track list -->
          <div class="rounded-xl border border-white/[0.08] bg-[#0f1219]/90 overflow-hidden">
            <div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3">
              <p class="text-xs font-bold uppercase tracking-widest text-[#c084fc]">Songs</p>
              <span class="ml-auto text-xs text-[#64748b]">Edit titles as needed, then save</span>
            </div>
            <ol class="divide-y divide-white/[0.05]">
              <li
                v-for="(track, idx) in editableTracks"
                :key="idx"
                class="flex items-center gap-3 px-5 py-2.5 group hover:bg-white/[0.02] transition"
              >
                <span class="w-7 shrink-0 text-right text-xs font-mono text-[#4b5563] select-none">{{ idx + 1 }}</span>
                <div class="flex flex-1 min-w-0 flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                  <input
                    v-model="track.name"
                    type="text"
                    class="flex-1 min-w-0 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-white outline-none focus:border-[#a855f7]/50 focus:bg-[#0b0e14] transition placeholder:text-[#4b5563]"
                    placeholder="Song title"
                    :aria-label="`Song title for track ${idx + 1}`"
                  />
                  <span class="text-xs text-[#6b7280] sm:w-40 sm:shrink-0 truncate">{{ track.artist }}</span>
                </div>
                <button
                  type="button"
                  class="ml-1 shrink-0 opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-[#6b7280] hover:bg-rose-500/15 hover:text-rose-400 transition"
                  :aria-label="`Remove track ${idx + 1}`"
                  @click="removeTrack(idx)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              </li>
            </ol>
          </div>

          <!-- Bottom save bar -->
          <div class="sticky bottom-4 flex items-center justify-end gap-3">
            <p v-if="saveError" class="text-sm text-rose-400">{{ saveError }}</p>
            <button
              type="button"
              class="local-btn local-btn--gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-[0_8px_32px_rgba(168,85,247,0.35)] transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="saveBusy"
              @click="savePlaylist"
            >
              <svg v-if="!saveSuccess" class="h-4 w-4 shrink-0" :class="{ 'animate-spin': saveBusy }" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path v-if="saveBusy" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                <path v-else d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2M7 11l5 5 5-5M12 4v12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else class="h-4 w-4 shrink-0 text-emerald-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ saveBusy ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save Playlist' }}
            </button>
          </div>
        </div>

      </div>
    </main>

    <SpotifyPlaylistPicker
      :open="pickerOpen"
      :token="spotifyToken"
      @close="pickerOpen = false"
      @select="onPlaylistSelected"
    />
  </div>
</template>

<script setup>
definePageMeta({ name: "mb-playlists", layout: "music-bingo" });
import { allPlaylists, playlistApiFetch, resolvePlaylistImage } from "../../../data/playlistStore.js";


import { ref, computed, onMounted, nextTick } from 'vue'
import Papa from 'papaparse'

// Library playlists plus this host's saved ones (see data/playlistStore.js).
const savedPlaylists = allPlaylists
import LocalHeader from '../../../components/LocalHeader.vue'
import SpotifyPlaylistPicker from '../../../components/SpotifyPlaylistPicker.vue'
import {
  getStoredToken,
  hasClientId,
  startSpotifyAuth,
  fetchPlaylistTracksAndUris,
  fetchPlaylistMeta,
  fetchPlaylistTracks,
  parsePlaylistId,
} from '../../../composables/useSpotify.js'
import {
  hasYoutubeApiKey,
  parseYoutubePlaylistId,
  fetchYoutubePlaylistMeta,
  fetchYoutubePlaylistTracks,
} from '../../../composables/useYoutube.js'

const addTabs = [
  { id: 'spotify', label: 'Spotify' },
  { id: 'csv', label: 'CSV' },
  { id: 'youtube', label: 'YouTube' },
]
const addTab = ref('spotify')

// ── CSV import ─────────────────────────────────────────────────────────────────

const csvFileName = ref('')
const csvColumns = ref([])
const csvRows = ref([])
const csvTitleColumn = ref('')
const csvArtistColumn = ref('')
const csvError = ref('')

function handleCsvFile(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return

  csvError.value = ''
  csvFileName.value = file.name
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete(results) {
      if (!results.data.length) {
        csvError.value = 'No rows found in that file.'
        return
      }
      csvRows.value = results.data
      const cols = results.meta.fields || []
      csvColumns.value = cols
      csvTitleColumn.value = cols[0] || ''
      const artistGuess = cols.find((c) => /artist|author|subtitle|sub|by/i.test(c))
      csvArtistColumn.value = artistGuess || ''
    },
    error(err) {
      csvError.value = err?.message || 'Unable to parse that CSV file.'
    },
  })
}

function importCsv() {
  if (!csvTitleColumn.value) return
  const tracks = csvRows.value
    .map((row) => ({
      name: String(row[csvTitleColumn.value] || '').trim(),
      artist: csvArtistColumn.value ? String(row[csvArtistColumn.value] || '').trim() : '',
    }))
    .filter((t) => t.name)
  if (!tracks.length) {
    csvError.value = 'No usable rows found — check your column selection.'
    return
  }

  importSource.value = 'csv'
  sourceUrl.value = ''
  selectedPlaylistId.value = ''
  const title = csvFileName.value.replace(/\.csv$/i, '') || 'My Playlist'
  playlistTitle.value = title
  playlistFileId.value = slugify(title)
  editableTracks.value = tracks
  phase.value = 'review'
}

// ── YouTube import ─────────────────────────────────────────────────────────────

const youtubeConfigured = computed(() => hasYoutubeApiKey())
const youtubeUrl = ref('')
const youtubeBusy = ref(false)
const youtubeError = ref('')

async function importYoutube() {
  const playlistId = parseYoutubePlaylistId(youtubeUrl.value)
  if (!playlistId) {
    youtubeError.value = 'Could not find a playlist ID in that URL.'
    return
  }

  youtubeBusy.value = true
  youtubeError.value = ''
  loadingPlaylistName.value = 'YouTube playlist'
  phase.value = 'loading'
  try {
    const [meta, tracks] = await Promise.all([
      fetchYoutubePlaylistMeta(playlistId).catch(() => null),
      fetchYoutubePlaylistTracks(playlistId),
    ])
    if (!tracks.length) throw new Error('No videos found in that playlist.')

    importSource.value = 'youtube'
    selectedPlaylistId.value = playlistId
    sourceUrl.value = `https://www.youtube.com/playlist?list=${playlistId}`
    const title = meta?.title || 'My Playlist'
    playlistTitle.value = title
    playlistFileId.value = slugify(title)
    editableTracks.value = tracks
    phase.value = 'review'
  } catch (e) {
    youtubeError.value = e?.message || String(e)
    phase.value = 'pick'
  } finally {
    youtubeBusy.value = false
  }
}



const spotifyClientConfigured = computed(() => hasClientId())
const spotifyToken = ref(getStoredToken())
const authBusy = ref(false)
const authError = ref('')

const pickerOpen = ref(false)
const syncState = ref({}) // { [id]: 'syncing' | 'done' | 'error' }
const syncBusy = ref(false)

function setPlaylistSyncState(playlistId, status) {
  syncState.value = { ...syncState.value, [playlistId]: status }
}

async function syncAllPlaylists() {
  let token = getStoredToken() || spotifyToken.value
  if (!token) {
    await connectSpotify()
    token = getStoredToken() || spotifyToken.value
    if (!token) return
  }

  syncBusy.value = true
  syncState.value = {}
  const toSync = savedPlaylists.value.filter(p => p.spotifyPlaylistUrl)

  try {
    for (const playlist of toSync) {
      setPlaylistSyncState(playlist.id, 'syncing')
      await nextTick()
      const spotifyId = parsePlaylistId(playlist.spotifyPlaylistUrl)
      if (!spotifyId) {
        setPlaylistSyncState(playlist.id, 'error')
        continue
      }
      try {
        const [tracks, meta] = await Promise.all([
          fetchPlaylistTracks(spotifyId, token),
          fetchPlaylistMeta(spotifyId, token).catch(() => null),
        ])
        const updated = {
          ...playlist,
          spotifyPlaylistUrl: `https://open.spotify.com/playlist/${spotifyId}`,
          tracks: tracks
            .map(t => ({ name: String(t.text || '').trim(), artist: String(t.sub || '').trim() }))
            .filter(t => t.name),
        }
        const res = await playlistApiFetch('/api/write-playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: playlist.id, data: updated }),
        })
        const json = await res.json().catch(() => ({ ok: false }))
        setPlaylistSyncState(playlist.id, json.ok ? 'done' : 'error')
      } catch {
        setPlaylistSyncState(playlist.id, 'error')
      }
    }
  } finally {
    syncBusy.value = false
  }
}

const phase = ref('pick') // 'pick' | 'loading' | 'error' | 'review'
const loadingPlaylistName = ref('')
const fetchError = ref('')

const selectedPlaylistId = ref('')
const playlistFileId = ref('') // stable ID locked at import time, independent of editable title
const playlistTitle = ref('')
const editableTracks = ref([]) // [{ name, artist }]
const importSource = ref('spotify') // 'spotify' | 'csv' | 'youtube'
const sourceUrl = ref('') // external link shown in the review header, if any

onMounted(() => {
  window.addEventListener('storage', onStorageChange)
})

function onStorageChange() {
  const t = getStoredToken()
  if (t) spotifyToken.value = t
}

async function connectSpotify() {
  authBusy.value = true
  authError.value = ''
  try {
    await startSpotifyAuth({ usePopup: true })
    spotifyToken.value = getStoredToken()
  } catch (e) {
    authError.value = e?.message || String(e)
  } finally {
    authBusy.value = false
  }
}

async function onPlaylistSelected({ id, name }) {
  pickerOpen.value = false
  loadingPlaylistName.value = name || id
  phase.value = 'loading'
  fetchError.value = ''

  try {
    const token = getStoredToken() || spotifyToken.value
    const [{ tracks }, meta] = await Promise.all([
      fetchPlaylistTracksAndUris(id, token),
      fetchPlaylistMeta(id, token).catch(() => null),
    ])

    importSource.value = 'spotify'
    selectedPlaylistId.value = id
    sourceUrl.value = `https://open.spotify.com/playlist/${id}`
    const spotifyName = meta?.name || name || id
    playlistTitle.value = spotifyName
    playlistFileId.value = slugify(spotifyName)
    editableTracks.value = tracks.map(t => ({
      name: t.text || '',
      artist: t.sub || '',
    }))
    phase.value = 'review'
  } catch (e) {
    fetchError.value = e?.message || String(e)
    phase.value = 'error'
  }
}

function removeTrack(idx) {
  editableTracks.value.splice(idx, 1)
}

function resetToPick() {
  phase.value = 'pick'
  editableTracks.value = []
  selectedPlaylistId.value = ''
  playlistFileId.value = ''
  playlistTitle.value = ''
  sourceUrl.value = ''
  fetchError.value = ''
  csvFileName.value = ''
  csvColumns.value = []
  csvRows.value = []
  csvError.value = ''
  youtubeUrl.value = ''
  youtubeError.value = ''
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'playlist'
}

const saveError = ref('')
const saveBusy = ref(false)
const saveSuccess = ref(false)

async function savePlaylist() {
  const title = playlistTitle.value.trim() || 'My Playlist'
  const slug = playlistFileId.value || slugify(title)
  const data = {
    title,
    id: slug,
    image: "",
    type: importSource.value,
    ...(importSource.value === 'spotify' ? { spotifyPlaylistUrl: sourceUrl.value } : {}),
    ...(importSource.value === 'youtube' ? { youtubePlaylistUrl: sourceUrl.value } : {}),
    tracksDataUrl: `src/data/playlists/${slug}.json`,
    tracks: editableTracks.value
      .filter(t => t.name.trim())
      .map(t => ({ name: t.name.trim(), artist: t.artist.trim() })),
  }

  saveBusy.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    const res = await playlistApiFetch('/api/write-playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: slug, data }),
    })
    const json = await res.json().catch(() => ({ ok: false }))
    if (!json.ok) throw new Error(json.error || 'Save failed')
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e) {
    saveError.value = e?.message || String(e)
  } finally {
    saveBusy.value = false
  }
}
</script>

<style scoped>

.playlist-list-item--syncing {
  opacity: 0.8;
  pointer-events: none;
}

.playlist-sync-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
}

.playlist-sync-overlay__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fafafa;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
}

.spotify-connect-btn {
  background: #1db954;
  box-shadow: 0 4px 20px rgba(29, 185, 84, 0.4);
}

.sync-spinner {
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 2.5px solid rgba(255, 255, 255, 0.2);
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
