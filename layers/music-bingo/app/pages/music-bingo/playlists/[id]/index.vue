<template>
  <div
    class="local-layout flex min-h-full min-w-0 flex-1 flex-col bg-[#0b0e14] text-zinc-100"
  >
    <LocalHeader
      :title="playlist?.title || String(route.params.id)"
      :subtitle="playlistSubtitle"
    >
      <template #title>
        <input
          v-if="playlist && editing"
          v-model="editTitle"
          type="text"
          class="w-full max-w-sm rounded-md border border-transparent bg-transparent px-2 py-1 text-2xl font-bold tracking-tight text-white outline-none focus:border-[#a855f7]/50 focus:bg-[#0b0e14] transition placeholder:text-[#6b7280] text-center md:text-3xl"
          placeholder="Playlist title…"
        />
        <template v-else>{{
          playlist?.title || String(route.params.id)
        }}</template>
      </template>

      <RouterLink
        to="/music-bingo"
        class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
      >
        <svg
          class="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        All Playlists
      </RouterLink>
      <RouterLink
        :to="`/music-bingo/playlists/${route.params.id}/print`"
        class="local-btn local-btn--outline-purple inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-[#a855f7]/10"
      >
        <svg
          class="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 9V4h12v5M6 14h12v7H6v-7zM8 14v5h8v-5"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Print Cards
      </RouterLink>
    </LocalHeader>

    <main class="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        class="mx-auto flex w-full max-w-[860px] flex-1 flex-col px-4 pb-8 pt-8 md:px-6"
      >
        <div
          v-if="!playlist"
          class="flex flex-1 items-center justify-center text-sm text-[#64748b]"
        >
          Playlist not found.
        </div>

        <div v-else class="flex flex-1 flex-col gap-6">
          <!-- Edit / Save controls -->
          <div class="flex flex-wrap items-center justify-end gap-2">
            <p v-if="deleteError" class="mr-auto text-sm text-rose-400">
              {{ deleteError }}
            </p>
            <p v-else-if="saveError" class="mr-auto text-sm text-rose-400">
              {{ saveError }}
            </p>
            <p v-else-if="syncMessage" class="mr-auto text-sm text-emerald-400">
              {{ syncMessage }}
            </p>
            <p v-else-if="syncError" class="mr-auto text-sm text-rose-400">
              {{ syncError }}
            </p>
            <a
              v-if="playlist.spotifyPlaylistUrl && !editing"
              :href="playlist.spotifyPlaylistUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
            >
              <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.297c-.215.354-.676.465-1.029.25-2.819-1.723-6.365-2.112-10.542-1.157-.402.092-.803-.157-.895-.559-.092-.402.157-.803.559-.895 4.571-1.045 8.492-.595 11.657 1.337.354.215.465.675.25 1.024zm1.471-3.27c-.27.438-.843.576-1.281.306-3.225-1.981-8.141-2.556-11.958-1.399-.494.15-1.017-.13-1.167-.624-.15-.493.13-1.016.624-1.167 4.358-1.323 9.774-.682 13.476 1.594.438.27.576.843.306 1.29zm.126-3.403c-3.868-2.297-10.245-2.509-13.942-1.388-.592.18-1.218-.154-1.398-.746-.18-.591.154-1.218.746-1.398 4.241-1.287 11.29-1.038 15.741 1.607.532.316.708 1.002.392 1.534-.316.531-1.002.707-1.539.391z"/>
              </svg>
              Spotify
            </a>
            <button
              v-if="playlist.spotifyPlaylistUrl && !editing"
              type="button"
              class="local-btn local-btn--outline-purple inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-[#a855f7]/10 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="syncBusy || saveBusy"
              @click="syncWithSpotify"
            >
              <svg
                class="h-4 w-4 shrink-0"
                :class="{ 'animate-spin': syncBusy }"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ syncBusy ? "Syncing…" : "Sync with Spotify" }}
            </button>
            <a
              v-if="youtubeSourceUrl && !editing"
              :href="youtubeSourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
            >
              <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              View on YouTube
            </a>
            <button
              v-if="playlist.youtubePlaylistUrl && !editing"
              type="button"
              class="local-btn local-btn--outline-purple inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-[#a855f7]/10 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="syncBusy || saveBusy || !youtubeConfigured"
              :title="youtubeConfigured ? '' : 'Set NUXT_PUBLIC_YOUTUBE_API_KEY in .env to enable syncing'"
              @click="syncWithYoutube"
            >
              <svg
                class="h-4 w-4 shrink-0"
                :class="{ 'animate-spin': syncBusy }"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ syncBusy ? "Syncing…" : "Sync with YouTube" }}
            </button>
            <button
              v-if="!editing"
              type="button"
              class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
              @click="validatePlaylist"
            >
              <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Validate Playlist
            </button>
            <template v-if="editing">
              <button
                type="button"
                class="local-btn inline-flex items-center gap-2 rounded-xl border border-rose-500/30 px-4 py-2.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="deleteBusy"
                @click="deletePlaylist"
              >
                <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m2 0v13a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12zM10 11v6M14 11v6"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ deleteBusy ? "Deleting…" : "Delete Playlist" }}
              </button>
              <button
                type="button"
                class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                @click="cancelEdit"
              >
                Cancel
              </button>
              <button
                type="button"
                class="local-btn local-btn--gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="saveBusy"
                @click="savePlaylist"
              >
                <svg
                  v-if="!saveSuccess"
                  class="h-4 w-4 shrink-0"
                  :class="{ 'animate-spin': saveBusy }"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    v-if="saveBusy"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    v-else
                    d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2M7 11l5 5 5-5M12 4v12"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <svg
                  v-else
                  class="h-4 w-4 shrink-0 text-emerald-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ saveBusy ? "Saving…" : saveSuccess ? "Saved!" : "Save" }}
              </button>
            </template>
            <button
              v-else
              type="button"
              class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
              @click="startEdit"
            >
              <svg
                class="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Edit
            </button>
          </div>

          <!-- Cover art -->
          <div
            v-if="displayImageUrl || (editing && canSetLocalImage)"
            class="flex flex-col items-center gap-3"
          >
            <img
              v-if="displayImageUrl"
              :src="displayImageUrl"
              :alt="playlist.title"
              class="h-48 w-48 rounded-2xl object-cover shadow-lg ring-1 ring-white/10"
            />
            <div v-if="editing && canSetLocalImage" class="flex items-center gap-2">
              <label
                class="local-btn local-btn--outline-muted inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
              >
                {{ displayImageUrl ? "Change Image" : "Add Image" }}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  class="hidden"
                  @change="onImageFileChange"
                />
              </label>
              <button
                v-if="displayImageUrl"
                type="button"
                class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                @click="clearImage"
              >
                Remove
              </button>
            </div>
            <p v-if="imageError" class="text-sm text-rose-400">{{ imageError }}</p>
          </div>

          <!-- Validation report -->
          <div
            v-if="validateReport && validateVisible"
            class="rounded-xl border overflow-hidden"
            :class="validateReport.duplicates.length ? 'border-rose-500/30 bg-rose-950/30' : 'border-emerald-500/30 bg-emerald-950/30'"
          >
            <div class="flex items-center gap-3 border-b px-5 py-3" :class="validateReport.duplicates.length ? 'border-rose-500/20' : 'border-emerald-500/20'">
              <svg v-if="validateReport.duplicates.length === 0" class="h-4 w-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else class="h-4 w-4 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <p class="text-xs font-bold uppercase tracking-widest" :class="validateReport.duplicates.length ? 'text-rose-400' : 'text-emerald-400'">
                {{ validateReport.duplicates.length ? `${validateReport.duplicates.length} duplicate${validateReport.duplicates.length > 1 ? 's' : ''} found` : 'No duplicates found' }}
              </p>
              <button
                type="button"
                class="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-[#6b7280] hover:bg-white/10 hover:text-white transition"
                aria-label="Close validation report"
                @click="validateVisible = false"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div v-if="validateReport.duplicates.length === 0" class="px-5 py-3 text-sm text-emerald-300">
              All {{ validateReport.total }} tracks are unique.
            </div>
            <ul class="divide-y divide-white/5">
              <li
                v-for="dup in validateReport.duplicates"
                :key="dup.key"
                class="flex items-start gap-3 px-5 py-2.5"
              >
                <div class="flex flex-1 min-w-0 flex-col gap-0.5">
                  <span class="text-sm font-semibold text-white">{{ dup.name }}</span>
                  <span class="text-xs text-[#9ca3af]">{{ dup.artist }}</span>
                </div>
                <span class="shrink-0 text-xs text-rose-400 font-mono mt-0.5">tracks {{ dup.indices.join(', ') }}</span>
              </li>
            </ul>
          </div>

          <!-- Track list -->
          <div
            class="rounded-xl border border-white/8 bg-[#0f1219]/90 overflow-hidden"
          >
            <div
              class="flex items-center gap-3 border-b border-white/6 px-5 py-3"
            >
              <p
                class="text-xs font-bold uppercase tracking-widest text-[#c084fc]"
              >
                Songs
              </p>
              <span class="ml-auto text-sm text-[#64748b]"
                >{{
                  editing ? editTracks.length : playlist.tracks.length
                }}
                tracks</span
              >
            </div>

            <!-- Edit mode -->
            <ol v-if="editing" class="divide-y divide-white/5">
              <li
                v-for="(track, idx) in editTracks"
                :key="idx"
                class="flex items-center gap-3 px-5 py-2.5 group hover:bg-white/2 transition"
              >
                <span
                  class="w-7 shrink-0 text-right text-xs font-mono text-[#4b5563] select-none"
                  >{{ idx + 1 }}</span
                >
                <div class="flex flex-1 min-w-0 flex-col gap-0.5">
                  <div
                    class="flex flex-1 min-w-0 flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3"
                  >
                    <input
                      v-model="track.name"
                      type="text"
                      class="flex-1 min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-white outline-none focus:border-[#a855f7]/50 focus:bg-[#0b0e14] transition placeholder:text-[#4b5563]"
                      placeholder="Song title"
                      :aria-label="`Song title for track ${idx + 1}`"
                    />
                    <input
                      v-model="track.artist"
                      type="text"
                      class="sm:w-40 sm:shrink-0 rounded-md border border-transparent bg-transparent px-2 py-1 text-xs text-[#9ca3af] outline-none focus:border-[#a855f7]/50 focus:bg-[#0b0e14] transition placeholder:text-[#4b5563]"
                      placeholder="Artist"
                      :aria-label="`Artist for track ${idx + 1}`"
                    />
                  </div>
                  <p
                    v-if="isTrackOverridden(track)"
                    class="truncate px-2 text-[11px] italic text-[#6b7280]"
                  >
                    Originally: {{ track.originalName
                    }}<template v-if="track.originalArtist">
                      &middot; {{ track.originalArtist }}</template
                    >
                  </p>
                </div>
                <button
                  type="button"
                  class="ml-1 shrink-0 flex h-7 w-7 items-center justify-center rounded-md transition"
                  :class="
                    track.doNotPrint
                      ? 'text-amber-400 hover:bg-amber-500/15'
                      : 'text-[#6b7280] opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white'
                  "
                  :aria-label="`${track.doNotPrint ? 'Allow printing' : 'Do not print'} track ${idx + 1}`"
                  :title="track.doNotPrint ? 'Excluded from printed cards — click to allow printing' : 'Mark as do not print'"
                  @click="track.doNotPrint = !track.doNotPrint"
                >
                  <svg
                    v-if="track.doNotPrint"
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 4.24A9.77 9.77 0 0112 4c5 0 9 4 10 8-.31 1.2-.9 2.35-1.72 3.36M6.1 6.1C4.14 7.44 2.6 9.5 2 12c1 4 5 8 10 8 1.5 0 2.9-.36 4.14-1"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.75" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="ml-1 shrink-0 opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-md text-[#6b7280] hover:bg-rose-500/15 hover:text-rose-400 transition"
                  :aria-label="`Remove track ${idx + 1}`"
                  @click="editTracks.splice(idx, 1)"
                >
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              </li>
            </ol>

            <!-- Read-only mode -->
            <ol v-else class="divide-y divide-white/5">
              <li
                v-for="(track, idx) in playlist.tracks"
                :key="idx"
                class="flex items-center gap-3 px-5 py-2.5"
              >
                <span
                  class="w-7 shrink-0 text-right text-xs font-mono text-[#4b5563] select-none"
                  >{{ idx + 1 }}</span
                >
                <div
                  class="flex flex-1 min-w-0 flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"
                >
                  <span
                    class="flex-1 min-w-0 truncate text-sm font-semibold"
                    :class="track.doNotPrint ? 'text-[#6b7280]' : 'text-white'"
                    >{{ track.name }}</span
                  >
                  <span
                    class="text-xs text-[#6b7280] sm:w-40 sm:shrink-0 truncate"
                    >{{ track.artist }}</span
                  >
                </div>
                <span
                  v-if="track.doNotPrint"
                  class="shrink-0 rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300"
                  >Not printed</span
                >
              </li>
            </ol>
          </div>

          <!-- Sticky save bar (edit mode only) -->
          <div
            v-if="editing"
            class="sticky bottom-4 flex items-center justify-end gap-3"
          >
            <p v-if="saveError" class="text-sm text-rose-400">
              {{ saveError }}
            </p>
            <button
              type="button"
              class="local-btn local-btn--gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-[0_8px_32px_rgba(168,85,247,0.35)] transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="saveBusy"
              @click="savePlaylist"
            >
              <svg
                v-if="!saveSuccess"
                class="h-4 w-4 shrink-0"
                :class="{ 'animate-spin': saveBusy }"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  v-if="saveBusy"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  v-else
                  d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2M7 11l5 5 5-5M12 4v12"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                v-else
                class="h-4 w-4 shrink-0 text-emerald-300"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ saveBusy ? "Saving…" : saveSuccess ? "Saved!" : "Save" }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ name: "mb-playlists-id", layout: "music-bingo" });
import { getPlaylist, playlistApiFetch } from "../../../../data/playlistStore.js";

import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import LocalHeader from "../../../../components/LocalHeader.vue";
import { resolvePlaylistImage } from "../../../../composables/useLocalPlaylists.js";
import {
  getStoredToken,
  parsePlaylistId,
  fetchPlaylistMeta,
  fetchPlaylistTracksAndUris,
  playlistSpecifiedCoverImageUrl,
  startSpotifyAuth,
  hasPlaylistModifyScope,
} from "../../../../composables/useSpotify.js";
import {
  syncPlaylistFromSpotify,
  describeSyncPlaylistResult,
} from "../../../../utils/syncPlaylistFromSpotify.js";
import { hasYoutubeApiKey } from "../../../../composables/useYoutube.js";
import {
  syncPlaylistFromYoutube,
  describeSyncPlaylistFromYoutubeResult,
} from "../../../../utils/syncPlaylistFromYoutube.js";

const route = useRoute();
const router = useRouter();

const playlist = computed(() => getPlaylist(route.params.id));

const spotifyImageUrl = ref("");

const coverImageUrl = computed(
  () => spotifyImageUrl.value || resolvePlaylistImage(playlist.value?.image),
);

// Local images can only be set for playlists that aren't Spotify-sourced
// (Spotify already supplies a live cover image via the API).
const canSetLocalImage = computed(() => !playlist.value?.spotifyPlaylistUrl);

const editImageDataUrl = ref("");
const editImageCleared = ref(false);
const imageError = ref("");

const displayImageUrl = computed(() => {
  if (editing.value && canSetLocalImage.value) {
    if (editImageCleared.value) return "";
    if (editImageDataUrl.value) return editImageDataUrl.value;
  }
  return coverImageUrl.value;
});

function onImageFileChange(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  imageError.value = "";
  const reader = new FileReader();
  reader.onload = () => {
    editImageDataUrl.value = String(reader.result || "");
    editImageCleared.value = false;
  };
  reader.onerror = () => {
    imageError.value = "Could not read that image file.";
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  editImageDataUrl.value = "";
  editImageCleared.value = true;
}

const youtubeSourceUrl = computed(() => {
  const p = playlist.value;
  if (!p?.youtubePlaylistUrl) return "";
  if (p.type && p.type !== "youtube") return "";
  return p.youtubePlaylistUrl;
});

onMounted(async () => {
  const p = playlist.value;
  if (!p?.spotifyPlaylistUrl) return;
  const token = getStoredToken();
  if (!token) return;
  const playlistId = parsePlaylistId(p.spotifyPlaylistUrl);
  if (!playlistId) return;
  try {
    const meta = await fetchPlaylistMeta(playlistId, token);
    spotifyImageUrl.value = playlistSpecifiedCoverImageUrl(meta) || "";
  } catch (e) {
    console.warn(
      "[playlist cover] Spotify image fetch failed:",
      e?.message ?? e,
    );
  }
});

const editing = ref(false);
const editTitle = ref("");
const editTracks = ref([]);
const saveBusy = ref(false);
const saveError = ref("");
const saveSuccess = ref(false);

const deleteBusy = ref(false);
const deleteError = ref("");

const syncBusy = ref(false);
const syncError = ref("");
const syncMessage = ref("");

const youtubeConfigured = computed(() => hasYoutubeApiKey());

const validateReport = ref(null);
const validateVisible = ref(false);

function validatePlaylist() {
  const tracks = playlist.value?.tracks ?? [];
  const seen = new Map();
  tracks.forEach((t, idx) => {
    const key = (t.originalName || t.name).trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, { name: t.name.trim(), artist: t.artist.trim(), indices: [] });
    seen.get(key).indices.push(idx + 1);
  });
  const duplicates = [];
  for (const [key, entry] of seen) {
    if (entry.indices.length > 1) duplicates.push({ key, ...entry });
  }
  validateReport.value = { duplicates, total: tracks.length };
  validateVisible.value = true;
  removeError.value = "";
}

const playlistSubtitle = computed(() => {
  if (!playlist.value) return "";
  const count = editing.value
    ? editTracks.value.length
    : playlist.value.tracks?.length ?? 0;
  return `${count} tracks`;
});

function startEdit() {
  const p = playlist.value;
  if (!p) return;
  editTitle.value = p.title || "";
  editTracks.value = p.tracks.map((t) => ({
    name: t.name,
    artist: t.artist,
    originalName: t.originalName || t.name,
    originalArtist: t.originalArtist || t.artist,
    doNotPrint: !!t.doNotPrint,
  }));
  editImageDataUrl.value = "";
  editImageCleared.value = false;
  imageError.value = "";
  editing.value = true;
}

function isTrackOverridden(track) {
  const name = (track.name || "").trim();
  const artist = (track.artist || "").trim();
  const originalName = (track.originalName || "").trim();
  const originalArtist = (track.originalArtist || "").trim();
  if (!originalName) return false;
  return name !== originalName || artist !== originalArtist;
}

function cancelEdit() {
  editing.value = false;
  saveError.value = "";
  saveSuccess.value = false;
  deleteError.value = "";
}

async function deletePlaylist() {
  const p = playlist.value;
  if (!p) return;
  const confirmed = window.confirm(
    `Delete "${p.title}"? This cannot be undone.`,
  );
  if (!confirmed) return;

  deleteBusy.value = true;
  deleteError.value = "";
  try {
    const res = await playlistApiFetch(
      `/api/write-playlist?id=${encodeURIComponent(p.id)}`,
      { method: "DELETE" },
    );
    const json = await res.json().catch(() => ({ ok: false }));
    if (!json.ok) throw new Error(json.error || "Delete failed");
    router.push("/music-bingo/playlists");
  } catch (e) {
    deleteError.value = e?.message || String(e);
  } finally {
    deleteBusy.value = false;
  }
}

async function syncWithSpotify() {
  const p = playlist.value;
  if (!p?.spotifyPlaylistUrl) return;

  syncBusy.value = true;
  syncError.value = "";
  syncMessage.value = "";

  try {
    let token = getStoredToken();
    const hasModify = hasPlaylistModifyScope();
    if (!token || !hasModify) {
      await startSpotifyAuth({ usePopup: true, forceConsent: !hasModify });
      token = getStoredToken();
    }
    if (!token) throw new Error("Spotify authorization required.");

    const result = await syncPlaylistFromSpotify(p, token);

    if (result.tracks.length === result.spotifyTrackCount) {
      const res = await playlistApiFetch("/api/write-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, data: result.updatedPlaylist }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      if (!json.ok) throw new Error(json.error || "Failed to save playlist");
    } else {
      throw new Error(
        `Sync produced ${result.tracks.length} tracks but Spotify has ${result.spotifyTrackCount}.`,
      );
    }

    syncMessage.value = describeSyncPlaylistResult(result);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (e) {
    syncError.value = e?.message || String(e);
    syncBusy.value = false;
  }
}

async function syncWithYoutube() {
  const p = playlist.value;
  if (!p?.youtubePlaylistUrl) return;

  syncBusy.value = true;
  syncError.value = "";
  syncMessage.value = "";

  try {
    const result = await syncPlaylistFromYoutube(p);

    if (result.tracks.length === result.youtubeTrackCount) {
      const res = await playlistApiFetch("/api/write-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, data: result.updatedPlaylist }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      if (!json.ok) throw new Error(json.error || "Failed to save playlist");
    } else {
      throw new Error(
        `Sync produced ${result.tracks.length} tracks but YouTube has ${result.youtubeTrackCount}.`,
      );
    }

    syncMessage.value = describeSyncPlaylistFromYoutubeResult(result);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (e) {
    syncError.value = e?.message || String(e);
    syncBusy.value = false;
  }
}

async function savePlaylist() {
  const p = playlist.value;
  if (!p) return;

  const data = {
    ...p,
    title: editTitle.value.trim() || p.title,
    tracks: editTracks.value
      .filter((t) => t.name.trim())
      .map((t) => ({
        name: t.name.trim(),
        artist: t.artist.trim(),
        originalName: (t.originalName || t.name).trim(),
        originalArtist: (t.originalArtist || t.artist).trim(),
        ...(t.doNotPrint ? { doNotPrint: true } : {}),
      })),
  };

  saveBusy.value = true;
  saveError.value = "";
  saveSuccess.value = false;
  try {
    if (canSetLocalImage.value && editImageDataUrl.value) {
      const uploadRes = await playlistApiFetch("/api/upload-playlist-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, dataUrl: editImageDataUrl.value }),
      });
      const uploadJson = await uploadRes.json().catch(() => ({ ok: false }));
      if (!uploadJson.ok) throw new Error(uploadJson.error || "Image upload failed");
      data.image = uploadJson.image;
    } else if (canSetLocalImage.value && editImageCleared.value) {
      data.image = "";
    }

    const res = await playlistApiFetch("/api/write-playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, data }),
    });
    const json = await res.json().catch(() => ({ ok: false }));
    if (!json.ok) throw new Error(json.error || "Save failed");
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
      editing.value = false;
    }, 1500);
  } catch (e) {
    saveError.value = e?.message || String(e);
  } finally {
    saveBusy.value = false;
  }
}
</script>
