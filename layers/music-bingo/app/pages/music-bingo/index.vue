<template>
  <div
    class="local-layout flex min-h-full min-w-0 flex-1 flex-col bg-[#0b0e14] text-zinc-100"
  >
    <LocalHeader
      title="New Local Game"
      subtitle="Select a playlist and winning pattern to get started."
    >
      <RouterLink
        v-if="activeLocalPlaylistId"
        to="/music-bingo/print"
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
      <RouterLink
        to="/music-bingo/audience"
        target="_blank"
        rel="noopener noreferrer"
        class="local-btn local-btn--gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-lg transition hover:brightness-110"
      >
        <svg
          class="h-4 w-4 shrink-0 opacity-95"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="2"
            y="4"
            width="20"
            height="14"
            rx="2"
            stroke="currentColor"
            stroke-width="1.75"
          />
          <path
            d="M8 21h8"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
          />
          <path
            d="M12 17v4"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
          />
        </svg>
        Audience Screen
      </RouterLink>

      <template #status>
        <p
          v-if="updatePlaylistsSummary"
          class="mx-auto mt-3 max-w-[1520px] border-t border-white/[0.06] px-4 pt-3 text-center text-xs leading-relaxed text-[#9ca3af] md:px-6"
        >
          {{ updatePlaylistsSummary }}
        </p>
      </template>
    </LocalHeader>

    <main class="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        class="local-shell mx-auto flex w-full max-w-[1520px] flex-1 flex-col px-4 pb-6 pt-6 md:px-6 md:pb-8 md:pt-8"
      >
        <div class="local-panels grid flex-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <!-- ── Playlist panel ── -->
          <section
            class="local-panel flex flex-col rounded-xl border border-white/[0.08] bg-[#0f1219]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-6"
          >
            <div class="local-panel-head mb-5 flex gap-4">
              <span
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#a855f7]/20 text-xl text-[#c084fc]"
                aria-hidden="true"
                >♪</span
              >
              <div class="min-w-0">
                <h2 class="text-lg font-bold text-white md:text-xl">
                  1. Select a Playlist
                </h2>
                <p class="mt-0.5 text-sm leading-snug text-[#9ca3af]">
                  Choose the playlist your bingo game will use.
                </p>
              </div>
            </div>

            <!-- ── Phase: pick ── -->
            <div v-if="phase === 'pick'" class="flex flex-1 flex-col gap-5">
              <!-- Playlists grid -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs text-[#64748b]">
                    {{ savedPlaylists.length }} playlist{{
                      savedPlaylists.length !== 1 ? "s" : ""
                    }}
                  </span>
                  <button
                    v-if="savedPlaylists.some((p) => p.spotifyPlaylistUrl)"
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c084fc] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="syncBusy"
                    @click="syncAllPlaylists"
                  >
                    <svg
                      class="h-3.5 w-3.5 shrink-0"
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
                </div>

                <div
                  v-if="savedPlaylists.length === 0"
                  class="rounded-xl border border-white/[0.06] bg-[#0f1219]/60 px-6 py-10 text-center text-sm text-[#64748b]"
                >
                  No playlists saved yet. Add one from Spotify below.
                </div>

                <div v-else class="playlist-grid">
                  <div
                    v-for="playlist in savedPlaylists"
                    :key="playlist.id"
                    class="playlist-card-wrap relative"
                    :class="{
                      'playlist-card-wrap--syncing':
                        syncState[playlist.id] === 'syncing',
                    }"
                  >
                    <button
                      type="button"
                      class="playlist-card group w-full text-left"
                      :class="{
                        'playlist-card--selected': playlistRowIsSelected({
                          id: playlist.id,
                        }),
                      }"
                      :disabled="syncState[playlist.id] === 'syncing'"
                      @click="selectSavedPlaylist(playlist.id)"
                    >
                      <div class="playlist-card__cover">
                        <img
                          v-if="playlistCoverUrl(playlist)"
                          :src="playlistCoverUrl(playlist)"
                          :alt="playlist.title"
                          class="h-full w-full object-cover"
                          @error="onCoverError(playlist.id)"
                        />
                        <div
                          v-else
                          class="flex h-full w-full items-center justify-center bg-[#a855f7]/15"
                        >
                          <svg
                            class="h-8 w-8 text-[#a855f7]"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M9 18V5l12-2v13"
                              stroke="currentColor"
                              stroke-width="1.75"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <circle
                              cx="6"
                              cy="18"
                              r="3"
                              stroke="currentColor"
                              stroke-width="1.75"
                            />
                            <circle
                              cx="18"
                              cy="16"
                              r="3"
                              stroke="currentColor"
                              stroke-width="1.75"
                            />
                          </svg>
                        </div>
                        <span
                          v-if="playlistRowIsSelected({ id: playlist.id })"
                          class="playlist-card__check"
                          aria-hidden="true"
                        >
                          <svg
                            class="h-3.5 w-3.5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M20 6L9 17l-5-5"
                              stroke="currentColor"
                              stroke-width="2.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </span>
                        <!-- Done badge -->
                        <span
                          v-if="syncState[playlist.id] === 'done'"
                          class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-lg"
                          aria-label="Synced"
                        >
                          <svg
                            class="h-3.5 w-3.5 text-white"
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
                        </span>
                        <!-- Error badge -->
                        <span
                          v-else-if="syncState[playlist.id] === 'error'"
                          class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 shadow-lg"
                          aria-label="Sync failed"
                        >
                          <svg
                            class="h-3.5 w-3.5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M18 6L6 18M6 6l12 12"
                              stroke="currentColor"
                              stroke-width="2.5"
                              stroke-linecap="round"
                            />
                          </svg>
                        </span>
                      </div>
                      <div class="playlist-card__meta">
                        <p class="playlist-card__title">{{ playlist.title }}</p>
                        <p class="playlist-card__count">
                          <template v-if="syncState[playlist.id] === 'syncing'">
                            Syncing…
                          </template>
                          <template v-else-if="syncState[playlist.id] === 'done'">
                            Synced
                          </template>
                          <template v-else-if="syncState[playlist.id] === 'error'">
                            Sync failed
                          </template>
                          <template v-else>
                            {{ playlist.tracks?.length ?? 0 }} songs
                          </template>
                        </p>
                      </div>
                    </button>
                    <div
                      v-if="syncState[playlist.id] === 'syncing'"
                      class="playlist-sync-overlay"
                      aria-live="polite"
                      aria-busy="true"
                    >
                      <span class="sync-spinner" aria-hidden="true" />
                      <span class="playlist-sync-overlay__label">Syncing…</span>
                    </div>
                    <!-- Edit link -->
                    <RouterLink
                      :to="{
                        name: 'mb-playlists-id',
                        params: { id: playlist.id },
                      }"
                      class="playlist-edit-btn"
                      :aria-label="`Edit ${playlist.title}`"
                      @click.stop
                    >
                      <svg
                        class="h-3.5 w-3.5"
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
                    </RouterLink>
                  </div>
                </div>
              </div>

              <!-- Add from Spotify panel -->
              <div
                class="rounded-xl border border-white/[0.08] bg-[#0b0e14]/60 px-4 py-4"
              >
                <div class="flex items-center gap-3 mb-3">
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1db954]/15"
                  >
                    <svg
                      class="h-4 w-4 text-[#1db954]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white">
                      Add from Spotify
                    </p>
                    <p class="text-xs text-[#9ca3af]">
                      Import tracks from any Spotify playlist
                    </p>
                  </div>
                </div>

                <div
                  v-if="!spotifyClientConfigured"
                  class="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 text-center"
                >
                  Spotify is not configured. Set
                  <code
                    class="rounded bg-black/30 px-1 py-0.5 text-xs font-mono"
                    >NUXT_PUBLIC_SPOTIFY_CLIENT_ID</code
                  >
                  in your environment.
                </div>

                <template v-else>
                  <div v-if="!spotifyToken" class="flex flex-col gap-2">
                    <button
                      type="button"
                      class="spotify-connect-btn inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="authBusy"
                      @click="connectSpotify"
                    >
                      <svg
                        class="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
                        />
                      </svg>
                      {{ authBusy ? "Opening Spotify…" : "Connect Spotify" }}
                    </button>
                    <p v-if="authError" class="text-xs text-rose-300">
                      {{ authError }}
                    </p>
                  </div>

                  <div v-else class="flex items-center gap-3">
                    <p
                      class="flex flex-1 items-center gap-2 text-sm text-emerald-300/95"
                    >
                      <span
                        class="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                      />
                      Spotify connected
                    </p>
                    <button
                      type="button"
                      class="spotify-connect-btn inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
                      @click="pickerOpen = true"
                    >
                      <svg
                        class="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
                        />
                      </svg>
                      Add Spotify Playlist
                    </button>
                  </div>
                </template>
              </div>
            </div>

            <!-- ── Phase: loading ── -->
            <div
              v-else-if="phase === 'loading'"
              class="flex flex-1 flex-col items-center justify-center gap-5 text-center"
            >
              <span class="loading-spinner" aria-hidden="true" />
              <p class="text-sm text-[#9ca3af]">
                Loading tracks from
                <span class="font-semibold text-white">{{
                  loadingPlaylistName
                }}</span
                >…
              </p>
            </div>

            <!-- ── Phase: error ── -->
            <div
              v-else-if="phase === 'error'"
              class="flex flex-1 flex-col items-center justify-center gap-5 text-center"
            >
              <div
                class="max-w-sm w-full rounded-xl border border-rose-500/35 bg-rose-500/10 px-6 py-5"
              >
                <p class="mb-1 font-semibold text-rose-300">
                  Failed to load tracks
                </p>
                <p class="text-sm text-rose-200/70">{{ fetchError }}</p>
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
            <div
              v-else-if="phase === 'review'"
              class="flex flex-1 flex-col gap-3 min-h-0"
            >
              <!-- Header row -->
              <div
                class="rounded-xl border border-white/[0.08] bg-[#0f1219]/90 p-4"
              >
                <p
                  class="mb-2 text-xs font-bold uppercase tracking-widest text-[#c084fc]"
                >
                  New Playlist
                </p>
                <input
                  v-model="playlistTitle"
                  type="text"
                  class="w-full rounded-lg border border-white/10 bg-[#0b0e14] px-3 py-2 text-base font-bold text-white outline-none focus:border-[#a855f7]/60 transition"
                  placeholder="Playlist title…"
                />
                <p class="mt-1.5 text-xs text-[#64748b]">
                  <a
                    :href="`https://open.spotify.com/playlist/${selectedPlaylistId}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-[#c084fc] underline decoration-[#a855f7]/40 underline-offset-2 hover:text-fuchsia-300"
                  >
                    View on Spotify
                  </a>
                  · {{ editableTracks.length }} tracks
                </p>
                <div class="mt-3 flex gap-2">
                  <button
                    type="button"
                    class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
                    @click="resetToPick"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="local-btn local-btn--gradient inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                    @click="savePlaylist"
                  >
                    <svg
                      class="h-4 w-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2M7 11l5 5 5-5M12 4v12"
                        stroke="currentColor"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    Save Playlist JSON
                  </button>
                </div>
              </div>

              <!-- Scrollable track list -->
              <div
                class="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0f1219]/90"
              >
                <div
                  class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3"
                >
                  <p
                    class="text-xs font-bold uppercase tracking-widest text-[#c084fc]"
                  >
                    Songs
                  </p>
                  <span class="ml-auto text-xs text-[#64748b]"
                    >Edit titles as needed, then save</span
                  >
                </div>
                <ol class="divide-y divide-white/[0.05]">
                  <li
                    v-for="(track, idx) in editableTracks"
                    :key="idx"
                    class="group flex items-center gap-3 px-5 py-2.5 transition hover:bg-white/[0.02]"
                  >
                    <span
                      class="w-7 shrink-0 select-none text-right font-mono text-xs text-[#4b5563]"
                      >{{ idx + 1 }}</span
                    >
                    <div
                      class="flex flex-1 min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <input
                        v-model="track.name"
                        type="text"
                        class="flex-1 min-w-0 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-white outline-none focus:border-[#a855f7]/50 focus:bg-[#0b0e14] transition"
                        placeholder="Song title"
                        :aria-label="`Song title for track ${idx + 1}`"
                      />
                      <span
                        class="truncate text-xs text-[#6b7280] sm:w-36 sm:shrink-0"
                        >{{ track.artist }}</span
                      >
                    </div>
                    <button
                      type="button"
                      class="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#6b7280] opacity-0 transition hover:bg-rose-500/15 hover:text-rose-400 group-hover:opacity-100"
                      :aria-label="`Remove track ${idx + 1}`"
                      @click="removeTrack(idx)"
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
              </div>
            </div>
          </section>

          <!-- ── Right column: grid size + winning pattern ── -->
          <div class="flex flex-col gap-6 lg:gap-8">
            <!-- ── Grid size panel ── -->
            <section
              class="local-panel flex flex-col rounded-xl border border-white/[0.08] bg-[#0f1219]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-6"
            >
              <div class="local-panel-head mb-6 flex gap-4">
                <span
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#a855f7]/20 text-xl text-[#c084fc]"
                  aria-hidden="true"
                  >▦</span
                >
                <div class="min-w-0">
                  <h2 class="text-lg font-bold text-white md:text-xl">
                    2. Select a Grid Size
                  </h2>
                  <p class="mt-0.5 text-sm leading-snug text-[#9ca3af]">
                    Choose the bingo card size for this game.
                  </p>
                </div>
              </div>

              <div class="pattern-grid">
                <button
                  v-for="size in [5, 4]"
                  :key="size"
                  type="button"
                  class="pattern-card text-left"
                  :class="{ 'pattern-card--selected': gridSize === size }"
                  @click="setGridSize(size)"
                >
                  <div class="pattern-card__diagram local-pattern-diagram">
                    <BingoWinPatternDiagram
                      mode="none"
                      :grid-size="size"
                      :cell-px="size === 5 ? 15 : 18"
                      :gap-px="3"
                      :show-free-center="false"
                    />
                  </div>
                  <p class="pattern-card__name">{{ size }} x {{ size }}</p>
                  <p class="pattern-card__desc">
                    {{
                      size === 5
                        ? "Classic bingo card (default)."
                        : "Smaller, faster-paced card."
                    }}
                  </p>
                </button>
              </div>
            </section>

            <!-- ── Winning pattern panel ── -->
            <section
              class="local-panel flex flex-col rounded-xl border border-white/[0.08] bg-[#0f1219]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-6"
            >
              <div class="local-panel-head mb-6 flex gap-4">
                <span
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#a855f7]/20 text-xl text-[#c084fc]"
                  aria-hidden="true"
                  >★</span
                >
                <div class="min-w-0">
                  <h2 class="text-lg font-bold text-white md:text-xl">
                    3. Select a Winning Pattern
                  </h2>
                  <p class="mt-0.5 text-sm leading-snug text-[#9ca3af]">
                    Choose how players will win the game.
                  </p>
                </div>
              </div>

              <div class="pattern-grid">
                <button
                  v-for="card in visiblePatternCards"
                  :key="card.id"
                  type="button"
                  class="pattern-card text-left"
                  :class="{
                    'pattern-card--selected': bingoGameType === card.id,
                  }"
                  @click="setBingoGameType(card.id)"
                >
                  <div class="pattern-card__diagram local-pattern-diagram">
                    <BingoWinPatternDiagram
                      :mode="card.id"
                      :grid-size="gridSize"
                      :cell-px="30"
                      :gap-px="6"
                      :show-free-center="false"
                    />
                  </div>
                  <p class="pattern-card__name">{{ card.title }}</p>
                  <p class="pattern-card__desc">{{ card.description }}</p>
                </button>
              </div>
            </section>
          </div>
        </div>

        <footer
          class="local-footer mt-8 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#0f1219]/80 px-4 py-3 text-sm text-[#9ca3af] md:items-center md:px-5"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-bold text-[#c084fc]"
            aria-hidden="true"
            >i</span
          >
          <p class="leading-snug">
            You can always change these settings later before starting your
            game.
          </p>
        </footer>
      </div>
    </main>

    <!-- Update local playlists modal -->
    <Teleport to="body">
      <div
        v-if="updatePlaylistsModalOpen"
        class="update-pl-modal-backdrop fixed inset-0 z-[200] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]"
        role="presentation"
        @click.self="updatePlaylistsModalOpen = false"
      >
        <div
          class="max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0f1219] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="update-playlists-modal-title"
        >
          <div
            class="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4"
          >
            <div>
              <h2
                id="update-playlists-modal-title"
                class="text-lg font-bold text-white"
              >
                Update local playlists
              </h2>
              <p class="mt-1 text-sm text-[#9ca3af]">
                Load each Spotify playlist from
                <code class="rounded bg-black/40 px-1 py-0.5 text-xs"
                  >src/config.json</code
                >
                and download a ZIP whose only folder is
                <code class="rounded bg-black/40 px-1 py-0.5 text-xs"
                  >playlists/</code
                >
                (copy JSON files into
                <code class="rounded bg-black/40 px-1 py-0.5 text-xs"
                  >src/data/playlists/</code
                >
                in this repo).
              </p>
            </div>
            <button
              type="button"
              class="rounded-lg p-2 text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
              @click="updatePlaylistsModalOpen = false"
            >
              <svg
                class="h-5 w-5"
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
          </div>

          <div class="max-h-[min(60vh,420px)] overflow-y-auto px-5 py-4">
            <div
              v-if="!spotifyClientConfigured"
              class="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
            >
              Spotify is not configured. Set
              <code class="font-mono text-xs">NUXT_PUBLIC_SPOTIFY_CLIENT_ID</code> in
              your environment and rebuild, or run
              <code class="font-mono text-xs">pnpm update-local-playlists</code>
              with
              <code class="font-mono text-xs">SPOTIFY_ACCESS_TOKEN</code> from
              the terminal instead.
            </div>

            <template v-else-if="!spotifyToken">
              <p class="text-sm leading-relaxed text-[#e4e4e7]">
                Sign in with Spotify so this page can read playlist tracks from
                the Spotify Web API (same permission as the rest of Bingo
                Beats).
              </p>
              <button
                type="button"
                class="local-btn-spotify mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="authBusy"
                @click="connectSpotify"
              >
                {{ authBusy ? "Opening Spotify…" : "Authorize Spotify" }}
              </button>
              <p v-if="authError" class="mt-3 text-sm text-rose-300">
                {{ authError }}
              </p>
            </template>

            <template v-else>
              <p class="flex items-center gap-2 text-sm text-emerald-300/95">
                <span
                  class="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                />
                Spotify connected — you can fetch playlists now.
              </p>
            </template>

            <p
              v-if="updatePlaylistsModalMessage"
              class="mt-4 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs leading-relaxed text-[#cbd5e1]"
            >
              {{ updatePlaylistsModalMessage }}
            </p>
          </div>

          <div
            class="flex flex-wrap justify-end gap-3 border-t border-white/10 bg-[#0b0e14]/80 px-5 py-4"
          >
            <button
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
              @click="updatePlaylistsModalOpen = false"
            >
              Close
            </button>
            <button
              v-if="spotifyClientConfigured && spotifyToken"
              type="button"
              class="local-btn local-btn--gradient rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
              :disabled="updatePlaylistsBusy"
              @click="runPlaylistZipFromModal"
            >
              {{ updatePlaylistsBusy ? "Fetching…" : "Fetch & download ZIP" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <SpotifyPlaylistPicker
      :open="pickerOpen"
      :token="spotifyToken"
      @close="pickerOpen = false"
      @select="onPlaylistSelected"
    />
  </div>
</template>

<script setup>
definePageMeta({ name: "mb-home", layout: "music-bingo" });
import { playlistApiFetch } from "../../data/playlistStore.js";

import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import LocalHeader from "../../components/LocalHeader.vue";
import BingoWinPatternDiagram from "../../components/BingoWinPatternDiagram.vue";
import { isBingoGameModeSupportedForGridSize } from "../../data/bingoWinPatterns.js";
import SpotifyPlaylistPicker from "../../components/SpotifyPlaylistPicker.vue";
import {
  resolvePlaylistEntryFromSelection,
  useSpotifyGames,
} from "../../composables/useSpotifyGames.js";
import { useLocalGame } from "../../composables/useLocalGame.js";
import {
  getStoredToken,
  hasClientId,
  startSpotifyAuth,
  fetchPlaylistTracksAndUris,
  fetchPlaylistMeta,
  fetchPlaylistTracks,
  parsePlaylistId,
  playlistSpecifiedCoverImageUrl,
} from "../../composables/useSpotify.js";
import {
  buildLocalPlaylistZipBlob,
  triggerZipDownload,
} from "../../utils/localPlaylistBulkUpdate.js";

// ── Saved playlists from JSON files ──────────────────────────────────────────

import {
  useLocalPlaylists,
  resolvePlaylistImage,
} from "../../composables/useLocalPlaylists.js";
const { playlists: savedPlaylists } = useLocalPlaylists();

const spotifyImageMap = ref({});
const failedSpotifyCovers = ref({});

function playlistCoverUrl(playlist) {
  if (!failedSpotifyCovers.value[playlist.id]) {
    return spotifyImageMap.value[playlist.id] || resolvePlaylistImage(playlist.image) || "";
  }
  return resolvePlaylistImage(playlist.image) || "";
}

function onCoverError(playlistId) {
  failedSpotifyCovers.value = { ...failedSpotifyCovers.value, [playlistId]: true };
}

async function fetchSpotifyCovers() {
  const token = getStoredToken();
  if (!token) return;
  const needsSpotifyImage = savedPlaylists.value.filter(
    (p) => p.spotifyPlaylistUrl,
  );
  for (const p of needsSpotifyImage) {
    const playlistId = parsePlaylistId(p.spotifyPlaylistUrl);
    if (!playlistId) continue;
    try {
      const meta = await fetchPlaylistMeta(playlistId, token);
      const url = playlistSpecifiedCoverImageUrl(meta);
      if (url) spotifyImageMap.value = { ...spotifyImageMap.value, [p.id]: url };
    } catch {
      // silently skip — local placeholder will show
    }
  }
}

// ── Game state ────────────────────────────────────────────────────────────────

const { activeLocalPlaylistId, setActiveLocalPlaylistId } = useLocalGame();
const {
  playlists,
  activePlaylistId,
  bingoGameType,
  setBingoGameType,
  gridSize,
  setGridSize,
  addLocalDemoPlaylist,
  selectPlaylist,
} = useSpotifyGames();

function playlistRowIsSelected(row) {
  const rid = String(row?.id ?? "").trim();
  if (!rid) return false;
  const active = String(activePlaylistId.value || "").trim();
  if (!active) return false;
  const byRow = resolvePlaylistEntryFromSelection(playlists.value, rid);
  const byActive = resolvePlaylistEntryFromSelection(playlists.value, active);
  if (byRow && byActive) return byRow.id === byActive.id;
  return active === rid;
}

function selectSavedPlaylist(id) {
  if (!playlists.value.some((p) => p.id === id)) {
    addLocalDemoPlaylist(id);
  }
  selectPlaylist(id);
  setActiveLocalPlaylistId(id);
}

// ── Spotify auth (shared between Add from Spotify panel & update modal) ──────

const spotifyToken = ref(getStoredToken());
const spotifyClientConfigured = computed(() => hasClientId());
const authBusy = ref(false);
const authError = ref("");

function refreshToken() {
  spotifyToken.value = getStoredToken();
  fetchSpotifyCovers();
}

async function connectSpotify() {
  authBusy.value = true;
  authError.value = "";
  try {
    await startSpotifyAuth({ usePopup: true });
    refreshToken();
  } catch (e) {
    authError.value = e?.message || String(e);
  } finally {
    authBusy.value = false;
  }
}

// ── Spotify playlist picker & import flow ─────────────────────────────────────

const pickerOpen = ref(false);
const phase = ref("pick"); // 'pick' | 'loading' | 'error' | 'review'
const loadingPlaylistName = ref("");
const fetchError = ref("");
const selectedPlaylistId = ref("");
const playlistFileId = ref(""); // stable ID locked at import time, independent of editable title
const playlistTitle = ref("");
const editableTracks = ref([]);

async function onPlaylistSelected({ id, name }) {
  pickerOpen.value = false;
  loadingPlaylistName.value = name || id;
  phase.value = "loading";
  fetchError.value = "";
  try {
    const token = getStoredToken() || spotifyToken.value;
    const [{ tracks }, meta] = await Promise.all([
      fetchPlaylistTracksAndUris(id, token),
      fetchPlaylistMeta(id, token).catch(() => null),
    ]);
    selectedPlaylistId.value = id;
    const spotifyName = meta?.name || name || id;
    playlistTitle.value = spotifyName;
    playlistFileId.value = slugify(spotifyName);
    editableTracks.value = tracks.map((t) => ({
      name: t.text || "",
      artist: t.sub || "",
    }));
    phase.value = "review";
  } catch (e) {
    fetchError.value = e?.message || String(e);
    phase.value = "error";
  }
}

function removeTrack(idx) {
  editableTracks.value.splice(idx, 1);
}

function resetToPick() {
  phase.value = "pick";
  editableTracks.value = [];
  selectedPlaylistId.value = "";
  playlistFileId.value = "";
  playlistTitle.value = "";
  fetchError.value = "";
}

function slugify(str) {
  return (
    String(str || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "playlist"
  );
}

function savePlaylist() {
  const title = playlistTitle.value.trim() || "My Playlist";
  const slug = playlistFileId.value || slugify(title);
  const data = {
    title,
    id: slug,
    image: "",
    spotifyPlaylistUrl: `https://open.spotify.com/playlist/${selectedPlaylistId.value}`,
    tracksDataUrl: `src/data/playlists/${slug}.json`,
    tracks: editableTracks.value
      .filter((t) => t.name.trim())
      .map((t) => ({ name: t.name.trim(), artist: t.artist.trim() })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sync all playlists ────────────────────────────────────────────────────────

const syncState = ref({});
const syncBusy = ref(false);

function setPlaylistSyncState(playlistId, status) {
  syncState.value = { ...syncState.value, [playlistId]: status };
}

async function syncAllPlaylists() {
  let token = getStoredToken() || spotifyToken.value;
  if (!token) {
    await connectSpotify();
    token = getStoredToken() || spotifyToken.value;
    if (!token) return;
  }
  syncBusy.value = true;
  syncState.value = {};
  const toSync = savedPlaylists.value.filter((p) => p.spotifyPlaylistUrl);
  try {
    for (const playlist of toSync) {
      setPlaylistSyncState(playlist.id, "syncing");
      await nextTick();
      const spotifyId = parsePlaylistId(playlist.spotifyPlaylistUrl);
      if (!spotifyId) {
        setPlaylistSyncState(playlist.id, "error");
        continue;
      }
      try {
        const [tracks, meta] = await Promise.all([
          fetchPlaylistTracks(spotifyId, token),
          fetchPlaylistMeta(spotifyId, token).catch(() => null),
        ]);
        const updated = {
          ...playlist,
          spotifyPlaylistUrl: `https://open.spotify.com/playlist/${spotifyId}`,
          tracks: tracks
            .map((t) => ({
              name: String(t.text || "").trim(),
              artist: String(t.sub || "").trim(),
            }))
            .filter((t) => t.name),
        };
        const res = await playlistApiFetch("/api/write-playlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: playlist.id, data: updated }),
        });
        const json = await res.json().catch(() => ({ ok: false }));
        setPlaylistSyncState(playlist.id, json.ok ? "done" : "error");
      } catch {
        setPlaylistSyncState(playlist.id, "error");
      }
    }
  } finally {
    syncBusy.value = false;
  }
}

// ── Update local playlists modal (ZIP download) ───────────────────────────────

const updatePlaylistsBusy = ref(false);
const updatePlaylistsSummary = ref("");
const updatePlaylistsModalOpen = ref(false);
const updatePlaylistsModalMessage = ref("");

function openUpdatePlaylistsModal() {
  updatePlaylistsModalOpen.value = true;
  updatePlaylistsModalMessage.value = "";
  refreshToken();
}

async function runPlaylistZipFromModal() {
  const token = getStoredToken();
  if (!token) {
    authError.value = "No Spotify token — authorize first.";
    refreshToken();
    return;
  }
  updatePlaylistsBusy.value = true;
  updatePlaylistsModalMessage.value = "";
  updatePlaylistsSummary.value = "";
  try {
    const { blob, skipped, errors, count } = await buildLocalPlaylistZipBlob(
      token,
    );
    const parts = [];
    if (count > 0 && blob) {
      triggerZipDownload(blob, `bingo-local-playlists-${Date.now()}.zip`);
      parts.push(
        `Downloaded ${count} playlist JSON file(s) as a ZIP (folder: playlists/). Copy those files into src/data/playlists/ in this repo.`,
      );
    }
    if (skipped.length) {
      parts.push(
        `${skipped.length} playlist(s) skipped (no spotifyPlaylistUrl in config).`,
      );
    }
    if (errors.length) {
      parts.push(
        `Errors: ${errors.map((e) => `${e.id}: ${e.message}`).join(" · ")}`,
      );
    }
    let message = parts.filter(Boolean).join(" ");
    if (count === 0) {
      if (errors.length > 1) {
        message = [
          ...parts.filter((p) => !p.startsWith("Errors:")),
          `Failures:\n${errors
            .map((e) => `• ${e.id}: ${e.message}`)
            .join("\n")}`,
        ]
          .filter(Boolean)
          .join("\n\n");
      } else if (errors.length === 1) {
        message = errors[0].message;
      } else if (!skipped.length) {
        message = "No playlists found in config.";
      } else {
        message =
          "No Spotify playlist URLs to fetch. Add spotifyPlaylistUrl for each playlist you want to update in src/config.json.";
      }
    }
    updatePlaylistsModalMessage.value = message;
    updatePlaylistsSummary.value = message.replace(/\n/g, " ");
  } catch (e) {
    const msg = e?.message || String(e);
    updatePlaylistsModalMessage.value = msg;
    updatePlaylistsSummary.value = msg;
  } finally {
    updatePlaylistsBusy.value = false;
  }
}

// ── Winning patterns ──────────────────────────────────────────────────────────

const patternCards = [
  {
    id: "standard",
    title: "Line",
    description: "Get 5 in a row horizontally, vertically, or diagonally.",
  },
  {
    id: "x",
    title: "X",
    description: "Mark both diagonal lines through the center.",
  },
  {
    id: "four-corners",
    title: "Plus",
    description: "Mark the full center row and center column.",
  },
  {
    id: "corners",
    title: "Four Corners",
    description: "Mark all four corner squares.",
  },
  {
    id: "wine-glass",
    title: "Wine Glass",
    description: "Mark the top row, rim, stem, and base to form a wine glass.",
  },
  {
    id: "border",
    title: "Border",
    description: "Mark every square around the outer edge of the card.",
  },
  {
    id: "blackout",
    title: "Blackout",
    description: "Mark all 25 squares.",
  },
];

const visiblePatternCards = computed(() =>
  patternCards.filter((card) =>
    isBingoGameModeSupportedForGridSize(card.id, gridSize.value),
  ),
);

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  const firstId = savedPlaylists.value[0]?.id;
  if (firstId && !activePlaylistId.value) {
    addLocalDemoPlaylist(firstId);
    selectPlaylist(firstId);
  }
  const mountId = activePlaylistId.value || savedPlaylists.value[0]?.id || "";
  setActiveLocalPlaylistId(mountId);
  window.addEventListener("storage", refreshToken);
  fetchSpotifyCovers();
});

onUnmounted(() => {
  window.removeEventListener("storage", refreshToken);
});
</script>

<style scoped>
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

@media (max-width: 520px) {
  .playlist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.playlist-card-wrap {
  position: relative;
}

.playlist-card-wrap--syncing {
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

.playlist-card {
  cursor: pointer;
  border-radius: 0.75rem;
  border: 2px solid transparent;
  background: rgba(15, 23, 42, 0.55);
  padding: 0;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
  width: 100%;
}

.playlist-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

.playlist-card--selected {
  border-color: #a855f7;
  box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.35),
    0 0 28px rgba(168, 85, 247, 0.22);
}

.playlist-card__cover {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #0f172a;
}

.playlist-card__check {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  background: linear-gradient(145deg, #a855f7, #9333ea);
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.65);
}

.playlist-card__meta {
  padding: 0.65rem 0.75rem 0.75rem;
}

.playlist-card__title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #fafafa;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-card__count {
  margin-top: 0.15rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.playlist-edit-btn {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.4rem;
  background: rgba(11, 14, 20, 0.75);
  color: #9ca3af;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
  text-decoration: none;
}

.playlist-card-wrap:hover .playlist-edit-btn {
  opacity: 1;
}

.playlist-edit-btn:hover {
  color: #c084fc;
  background: rgba(168, 85, 247, 0.2);
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
  to {
    transform: rotate(360deg);
  }
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.pattern-card {
  cursor: pointer;
  border-radius: 0.85rem;
  border: 2px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.45);
  padding: 1rem 0.85rem 1.1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.pattern-card:hover {
  border-color: rgba(168, 85, 247, 0.35);
  background: rgba(24, 32, 54, 0.75);
}

.pattern-card--selected {
  border-color: #a855f7;
  background: rgba(88, 28, 135, 0.2);
  box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.3),
    0 0 32px rgba(168, 85, 247, 0.15);
}

.pattern-card--disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.pattern-card--disabled:hover {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.45);
}

.pattern-card__unavailable {
  margin-top: 0.35rem;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #f87171;
}

.pattern-card__diagram {
  display: flex;
  justify-content: center;
  margin-bottom: 0.65rem;
}

.pattern-card__name {
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  background: linear-gradient(90deg, #c084fc, #f472b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.pattern-card__desc {
  margin-top: 0.35rem;
  text-align: center;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #9ca3af;
}

.local-pattern-diagram :deep(.pattern-diagram) {
  gap: 0;
}

.local-pattern-diagram :deep(.pattern-diagram__grid) {
  padding: 0.5rem;
  border-radius: 0.75rem;
  background: rgba(11, 14, 20, 0.75);
  border: 1px solid rgba(168, 85, 247, 0.18);
}

.local-pattern-diagram :deep(.pattern-diagram__hint) {
  display: none;
}

.local-pattern-diagram :deep(.pattern-diagram__cell--on) {
  background: linear-gradient(
    145deg,
    rgba(192, 132, 252, 0.95),
    rgba(168, 85, 247, 0.88)
  );
  border-color: rgba(232, 121, 249, 0.65);
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.45),
    inset 1px 0 rgba(255, 255, 255, 0.2);
}

.local-pattern-diagram
  :deep(.pattern-diagram__cell:not(.pattern-diagram__cell--on)) {
  background: rgba(51, 65, 85, 0.4);
  border-color: rgba(100, 116, 139, 0.28);
}
</style>
