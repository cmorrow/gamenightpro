<template>
  <div
    class="local-layout flex min-h-full min-w-0 flex-1 flex-col bg-[#0b0e14] text-zinc-100"
  >
    <LocalHeader
      title="Batch Print Cards"
      subtitle="Select one or more playlists, set options, and print them all at once."
    >
      <RouterLink
        :to="{ name: 'mb-home' }"
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
        Back
      </RouterLink>
    </LocalHeader>

    <main class="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        class="mx-auto grid w-full max-w-[1520px] flex-1 gap-6 px-4 pb-8 pt-6 md:px-6 lg:grid-cols-[380px_1fr] lg:gap-8"
      >
        <!-- ── Left sidebar: playlist select + print options ── -->
        <aside class="flex flex-col gap-5">
          <!-- Playlist multi-select -->
          <div
            class="rounded-xl border border-white/[0.08] bg-[#0f1219]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div class="mb-3 flex items-center justify-between">
              <h2
                class="text-sm font-bold uppercase tracking-[0.12em] text-[#c084fc]"
              >
                Playlists
              </h2>
              <div class="flex items-center gap-2">
                <span class="text-xs text-[#64748b]">
                  {{ selectedIds.length }} selected
                </span>
                <button
                  v-if="selectedIds.length > 0"
                  type="button"
                  class="text-xs text-[#9ca3af] underline underline-offset-2 hover:text-white"
                  @click="selectedIds = []"
                >
                  Clear
                </button>
                <button
                  v-if="selectedIds.length < allPlaylists.length"
                  type="button"
                  class="text-xs text-[#c084fc] underline underline-offset-2 hover:text-fuchsia-300"
                  @click="selectAll"
                >
                  All
                </button>
              </div>
            </div>

            <div
              v-if="allPlaylists.length === 0"
              class="rounded-xl border border-white/[0.06] bg-[#0b0e14]/60 px-4 py-8 text-center text-sm text-[#64748b]"
            >
              No playlists found.
            </div>

            <div v-else class="batch-playlist-grid">
              <div
                v-for="pl in allPlaylists"
                :key="pl.id"
                class="batch-pl-card-wrap"
              >
                <button
                  type="button"
                  class="batch-pl-card"
                  :class="{ 'batch-pl-card--selected': isSelected(pl.id) }"
                  @click="togglePlaylist(pl.id)"
                >
                  <div class="batch-pl-card__cover">
                    <img
                      v-if="playlistCoverUrl(pl)"
                      :src="playlistCoverUrl(pl)"
                      :alt="pl.title"
                      class="h-full w-full object-cover"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center bg-[#a855f7]/15"
                    >
                      <svg
                        class="h-6 w-6 text-[#a855f7]"
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
                      v-if="isSelected(pl.id)"
                      class="batch-pl-card__check"
                      aria-hidden="true"
                    >
                      <svg
                        class="h-3 w-3 text-white"
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
                  </div>
                  <div class="batch-pl-card__meta">
                    <p class="batch-pl-card__title">{{ pl.title }}</p>
                    <p class="batch-pl-card__count">
                      {{ pl.tracks?.length ?? 0 }} songs
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Print options -->
          <PrintOptionsPanel
            v-model:headerImage="headerImage"
            v-model:pageCount="pageCount"
            v-model:gridSize="gridSize"
            v-model:hasFreeSpace="hasFreeSpace"
            v-model:footerTitle="footerTitle"
            v-model:events="events"
            :selected-count="selectedIds.length"
            :blocked-count="blockedPlaylists.length"
            :printable-count="printablePlaylists.length"
            :total-cards="totalCards"
            :total-pages="totalPages"
            :pdf-busy="pdfBusy"
            :pdf-progress="pdfProgress"
            :pdf-error="pdfError"
            @download="requestDownload"
          >
            <template #before-download>
              <button
                type="button"
                class="local-btn local-btn--outline-muted inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45"
                :disabled="!previewPlaylist"
                @click="togglePreview"
              >
                <svg
                  class="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    stroke-width="1.75"
                  />
                  <path
                    d="M3 10h18"
                    stroke="currentColor"
                    stroke-width="1.75"
                  />
                  <path
                    d="M8 15h8"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                  />
                </svg>
                Print Preview
              </button>
            </template>
          </PrintOptionsPanel>
        </aside>

        <!-- ── Right: selected playlists summary ── -->
        <section class="flex flex-col gap-4">
          <div
            v-if="selectedIds.length === 0"
            class="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-white/[0.06] bg-[#0f1219]/60 px-6 py-16 text-center"
          >
            <svg
              class="h-12 w-12 text-[#374151]"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 9V4h12v5M6 14h12v7H6v-7zM8 14v5h8v-5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <div>
              <p class="text-base font-semibold text-[#4b5563]">
                No playlists selected
              </p>
              <p class="mt-1 text-sm text-[#374151]">
                Select one or more playlists from the left to print.
              </p>
            </div>
          </div>

          <div
            v-for="pl in selectedPlaylistDetails"
            :key="pl.id"
            class="rounded-xl border bg-[#0f1219]/90 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            :class="pl.notEnough ? 'border-amber-500/25' : 'border-white/8'"
          >
            <!-- Card header -->
            <div class="flex items-center gap-4 px-5 py-4">
              <div
                class="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg"
                :class="pl.coverClass"
              >
                <img
                  v-if="pl.coverUrl"
                  :src="pl.coverUrl"
                  :alt="pl.title"
                  class="h-full w-full object-cover"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-[#a855f7]/15 text-xl"
                >
                  ♪
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <input
                  v-if="isEditing(pl.id)"
                  v-model="inlineEditState[pl.id].title"
                  type="text"
                  class="w-full rounded-lg border border-white/20 bg-transparent px-1 py-0.5 font-bold text-white outline-none focus:border-[#a855f7]/50 focus:bg-[#0b0e14] transition"
                  placeholder="Playlist title…"
                />
                <p v-else class="truncate font-bold text-white">{{ pl.title }}</p>
                <p class="mt-0.5 text-sm text-[#9ca3af]">
                  {{ isEditing(pl.id) ? inlineEditState[pl.id].tracks.length : pl.trackCount }} songs ·
                  {{ cardCount }} cards · {{ pageCount }} pages
                </p>
                <p v-if="pl.notEnough && !isEditing(pl.id)" class="mt-1 text-xs text-amber-300">
                  Needs {{ pl.minTracks }} songs (has {{ pl.trackCount }}) — will be skipped
                </p>
                <p v-if="inlineEditError[pl.id]" class="mt-1 text-xs text-rose-300">
                  {{ inlineEditError[pl.id] }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <template v-if="isEditing(pl.id)">
                  <button
                    type="button"
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                    @click="cancelInlineEdit(pl.id)"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="local-btn local-btn--gradient inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                    :disabled="inlineEditBusy[pl.id]"
                    @click="saveInlineEdit(pl.id)"
                  >
                    <svg
                      v-if="!inlineEditSuccess[pl.id]"
                      class="h-3.5 w-3.5 shrink-0"
                      :class="{ 'animate-spin': inlineEditBusy[pl.id] }"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        v-if="inlineEditBusy[pl.id]"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
                      />
                      <path
                        v-else
                        d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2M7 11l5 5 5-5M12 4v12"
                        stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
                      />
                    </svg>
                    <svg
                      v-else
                      class="h-3.5 w-3.5 shrink-0 text-emerald-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    {{ inlineEditBusy[pl.id] ? "Saving…" : inlineEditSuccess[pl.id] ? "Saved!" : "Save" }}
                  </button>
                </template>
                <template v-else>
                  <button
                    type="button"
                    class="rounded-lg p-1.5 text-[#64748b] transition hover:bg-[#a855f7]/10 hover:text-[#c084fc]"
                    :aria-label="`Edit ${pl.title}`"
                    @click="startInlineEdit(pl.id)"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-1.5 text-[#4b5563] transition hover:bg-white/10 hover:text-[#9ca3af]"
                    :aria-label="`Remove ${pl.title} from selection`"
                    @click="togglePlaylist(pl.id)"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </template>
              </div>
            </div>

            <!-- Inline edit: editable track list -->
            <div v-if="isEditing(pl.id)" class="border-t border-white/5">
              <div class="flex items-center justify-between border-b border-white/4 px-5 py-2">
                <p class="text-xs font-bold uppercase tracking-widest text-[#c084fc]">
                  Songs <span class="ml-1 font-normal text-[#64748b]">{{ inlineEditState[pl.id].tracks.length }}</span>
                </p>
                <button
                  type="button"
                  class="text-xs text-[#9ca3af] underline underline-offset-2 hover:text-white transition"
                  @click="inlineEditState[pl.id].tracks.push({ name: '', artist: '', doNotPrint: false })"
                >
                  + Add song
                </button>
              </div>
              <ol class="divide-y divide-white/4 px-2 py-1">
                <li
                  v-for="(track, idx) in inlineEditState[pl.id].tracks"
                  :key="idx"
                  class="group flex items-center gap-2 py-1"
                >
                  <span class="w-7 shrink-0 select-none text-right font-mono text-xs text-[#374151]">{{ idx + 1 }}</span>
                  <div class="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <input
                      v-model="track.name"
                      type="text"
                      placeholder="Song title"
                      class="min-w-0 flex-1 rounded-md border border-white/20 bg-transparent px-2 py-1 text-sm font-semibold outline-none placeholder:text-[#374151] focus:border-[#a855f7]/40 focus:bg-[#0b0e14] transition"
                      :class="track.doNotPrint ? 'text-[#6b7280]' : 'text-white'"
                      :aria-label="`Song title for track ${idx + 1}`"
                    />
                    <input
                      v-model="track.artist"
                      type="text"
                      placeholder="Artist"
                      class="min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1 text-xs text-[#9ca3af] outline-none placeholder:text-[#374151] focus:border-[#a855f7]/40 focus:bg-[#0b0e14] transition sm:w-36 sm:shrink-0"
                      :aria-label="`Artist for track ${idx + 1}`"
                    />
                  </div>
                  <button
                    type="button"
                    class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition"
                    :class="
                      track.doNotPrint
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'text-[#374151] opacity-0 hover:text-[#9ca3af] group-hover:opacity-100'
                    "
                    :aria-label="`${track.doNotPrint ? 'Allow printing' : 'Do not print'} track ${idx + 1}`"
                    :title="track.doNotPrint ? 'Excluded from printed cards — click to allow printing' : 'Mark as do not print'"
                    @click="track.doNotPrint = !track.doNotPrint"
                  >
                    {{ track.doNotPrint ? "Not printed" : "Print" }}
                  </button>
                  <button
                    type="button"
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#374151] opacity-0 transition hover:bg-rose-500/15 hover:text-rose-400 group-hover:opacity-100"
                    :aria-label="`Remove track ${idx + 1}`"
                    @click="inlineEditState[pl.id].tracks.splice(idx, 1)"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </li>
              </ol>
            </div>

            <!-- View mode: collapsible read-only track list -->
            <div v-else class="border-t border-white/5">
              <button
                type="button"
                class="flex w-full items-center justify-between px-5 py-2.5 text-xs text-[#64748b] transition hover:text-[#9ca3af]"
                @click="toggleExpanded(pl.id)"
              >
                <span>{{ expandedIds.includes(pl.id) ? "Hide" : "Show" }} songs</span>
                <svg
                  class="h-3.5 w-3.5 transition-transform"
                  :class="expandedIds.includes(pl.id) ? 'rotate-180' : ''"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div v-if="expandedIds.includes(pl.id)" class="px-5 pb-4">
                <ol class="divide-y divide-white/4">
                  <li
                    v-for="(track, idx) in pl.tracks"
                    :key="idx"
                    class="flex items-center gap-3 py-1.5"
                  >
                    <span class="w-6 shrink-0 text-right font-mono text-xs text-[#374151]">{{ idx + 1 }}</span>
                    <span
                      class="flex-1 truncate text-sm"
                      :class="track.doNotPrint ? 'text-[#6b7280]' : 'text-[#e4e4e7]'"
                      >{{ track.name }}</span
                    >
                    <span class="shrink-0 truncate text-xs text-[#4b5563] md:w-36">{{ track.artist }}</span>
                    <span
                      v-if="track.doNotPrint"
                      class="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300"
                      >Not printed</span
                    >
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Off-screen render target for PDF generation -->
    <Teleport to="body">
      <div
        v-if="renderingPdf"
        class="pointer-events-none fixed left-[-9999px] top-0 z-[-1] w-[min(900px,100vw)]"
        aria-hidden="true"
      >
        <PrintableBingoPages
          v-for="(entry, idx) in pdfEntries"
          :key="entry.id"
          :ref="(el) => { if (el) pdfPagesRefs[idx] = el }"
          :cards="entry.cards"
          :title="entry.title"
          paper-size="letter"
          :theme="DEFAULT_THEME"
          :header-image="headerImage"
          :show-bingo-row="false"
          :grid-size="gridSize"
          :footer-title="footerTitle"
          :events="events"
        />
      </div>
    </Teleport>

    <!-- Print preview modal -->
    <Teleport to="body">
      <div
        v-if="previewVisible && previewPlaylist"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        @click.self="closePreview"
      >
        <div
          class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f1219] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
        >
          <div
            class="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4"
          >
            <div class="flex items-center gap-3">
              <p
                class="text-xs font-bold uppercase tracking-[0.12em] text-[#c084fc]"
              >
                Card Preview — {{ previewPlaylist.title }} (2 sample cards)
              </p>
              <span
                v-if="previewNotEnough"
                class="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300"
                >⚠ Needs {{ minTracks }} songs (has
                {{ previewPlaylist.trackCount }})</span
              >
              <span
                v-else-if="previewEmptyCellCount > 0"
                class="rounded bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-300"
                >⚠ {{ previewEmptyCellCount }} empty
                {{ previewEmptyCellCount === 1 ? "cell" : "cells" }} on card
                1</span
              >
              <span
                v-else
                class="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400"
                >✓ All cells filled</span
              >
            </div>
            <button
              type="button"
              class="shrink-0 rounded-lg p-1.5 text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
              aria-label="Close preview"
              @click="closePreview"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-4">
            <p
              v-if="previewNotEnough"
              class="rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
            >
              Add more songs to this playlist to preview cards.
            </p>
            <PrintableBingoPages
              v-else
              :cards="previewCards"
              :title="previewPlaylist.title"
              paper-size="letter"
              :theme="DEFAULT_THEME"
              :header-image="headerImage"
              :show-bingo-row="false"
              :grid-size="gridSize"
              :footer-title="footerTitle"
              :events="events"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Validation warning modal -->
    <PrintValidationModal
      v-if="showValidationModal"
      :issues="validationIssues"
      @proceed="confirmDownload"
      @cancel="showValidationModal = false"
    />
  </div>
</template>

<script setup>
definePageMeta({ name: "mb-print", layout: "music-bingo" });
import { playlistApiFetch } from "../../data/playlistStore.js";

import { computed, nextTick, onMounted, ref, watch } from "vue";
import LocalHeader from "../../components/LocalHeader.vue";
import PrintableBingoPages from "../../components/PrintableBingoPages.vue";
import PrintOptionsPanel from "../../components/PrintOptionsPanel.vue";
import PrintValidationModal from "../../components/PrintValidationModal.vue";
import { useBingoCards } from "../../composables/useBingoCards.js";
import { useExport } from "../../composables/useExport.js";
import { usePrintOptions } from "../../composables/usePrintOptions.js";
import { validateTracks, hasValidationIssues } from "../../composables/usePrintValidation.js";
import { DEFAULT_THEME } from "../../themes/index.js";
import {
  getPlaylistTracksData,
  getAllPlaylistsFromFiles,
} from "../../data/playlistTracks.js";
import {
  resolveConfiguredPlaylistCover,
  resolvePlaylistImagePath,
  gradientForPlaylistId,
} from "../../data/localPlaylists.js";
import { resolvePlaylistImage } from "../../composables/useLocalPlaylists.js";
import {
  getStoredToken,
  parsePlaylistId,
  fetchPlaylistMeta,
  playlistSpecifiedCoverImageUrl,
} from "../../composables/useSpotify.js";

// ── Session persistence (survives HMR reloads triggered by playlist file saves) ─

const SESSION_KEY_SELECTED = "print:selectedIds";
const SESSION_KEY_OVERRIDES = "print:localOverrides";
const SESSION_KEY_NAV = "print:navKey";

function sessionGet(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function sessionSet(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Detect fresh SPA navigation vs HMR reload. Vue Router updates history.state.key
// on every push/replace but leaves it unchanged during HMR remounts.
const _navKey = window.history.state?.key ?? null;
const _isFreshNavigation = _navKey !== sessionGet(SESSION_KEY_NAV, null);
if (_isFreshNavigation) sessionSet(SESSION_KEY_NAV, _navKey);

// ── Playlists (with local overrides so edits reflect immediately) ──────────────

const localOverrides = ref(sessionGet(SESSION_KEY_OVERRIDES, {}));

const allPlaylists = computed(() =>
  getAllPlaylistsFromFiles().map(({ id, name }) => {
    const data = getPlaylistTracksData(id);
    const override = localOverrides.value[id];
    return {
      id,
      title: String(override?.title ?? data?.title ?? name ?? id),
      image: data?.image || "",
      spotifyPlaylistUrl: data?.spotifyPlaylistUrl || "",
      tracks: override?.tracks ?? (Array.isArray(data?.tracks) ? data.tracks : []),
    };
  }),
);

const spotifyImageMap = ref({});

function playlistCoverUrl(pl) {
  return resolvePlaylistImage(pl.image) || spotifyImageMap.value[pl.id] || "";
}

async function fetchSpotifyCovers() {
  const token = getStoredToken();
  if (!token) return;
  const needsSpotifyImage = allPlaylists.value.filter(
    (p) => !resolvePlaylistImage(p.image) && p.spotifyPlaylistUrl,
  );
  for (const p of needsSpotifyImage) {
    const playlistId = parsePlaylistId(p.spotifyPlaylistUrl);
    if (!playlistId) continue;
    try {
      const meta = await fetchPlaylistMeta(playlistId, token);
      const url = playlistSpecifiedCoverImageUrl(meta);
      if (url) spotifyImageMap.value = { ...spotifyImageMap.value, [p.id]: url };
    } catch {
      // silently skip
    }
  }
}

// ── Multi-select ───────────────────────────────────────────────────────────────

const selectedIds = ref(_isFreshNavigation ? [] : sessionGet(SESSION_KEY_SELECTED, []));

function isSelected(id) {
  return selectedIds.value.includes(id);
}

function togglePlaylist(id) {
  const idx = selectedIds.value.indexOf(id);
  if (idx === -1) {
    selectedIds.value.push(id);
  } else {
    selectedIds.value.splice(idx, 1);
  }
}

function selectAll() {
  selectedIds.value = allPlaylists.value.map((p) => p.id);
}

onMounted(() => {
  watch(selectedIds, (v) => sessionSet(SESSION_KEY_SELECTED, v), { deep: true });
  watch(localOverrides, (v) => sessionSet(SESSION_KEY_OVERRIDES, v), { deep: true });
  fetchSpotifyCovers();
});

// ── Expanded track lists ───────────────────────────────────────────────────────

const expandedIds = ref([]);

function toggleExpanded(id) {
  const idx = expandedIds.value.indexOf(id);
  if (idx === -1) {
    expandedIds.value.push(id);
  } else {
    expandedIds.value.splice(idx, 1);
  }
}

// ── Print options ──────────────────────────────────────────────────────────────

const {
  headerImage,
  pageCount,
  cardCount,
  gridSize,
  hasFreeSpace,
  footerTitle,
  events,
  minTracks,
} = usePrintOptions();

// ── Selected playlist details ──────────────────────────────────────────────────

const selectedPlaylistDetails = computed(() =>
  selectedIds.value.map((id) => {
    const pl = allPlaylists.value.find((p) => p.id === id);
    if (!pl) return null;
    const tracks = pl.tracks;
    const printableTracks = tracks.filter((t) => !t.doNotPrint);
    const trackCount = printableTracks.length;
    const notEnough = trackCount < minTracks.value;
    const rawData = getPlaylistTracksData(id);
    return {
      id,
      title: pl.title,
      tracks,
      printableTracks,
      trackCount,
      notEnough,
      minTracks: minTracks.value,
      coverUrl:
        resolveConfiguredPlaylistCover(id, pl.title) ||
        resolvePlaylistImagePath(rawData?.image),
      coverClass: gradientForPlaylistId(id),
    };
  }).filter(Boolean),
);

const printablePlaylists = computed(() =>
  selectedPlaylistDetails.value.filter((p) => !p.notEnough),
);

const blockedPlaylists = computed(() =>
  selectedPlaylistDetails.value.filter((p) => p.notEnough),
);

const totalCards = computed(
  () => printablePlaylists.value.length * Math.max(1, cardCount.value),
);

const totalPages = computed(
  () => printablePlaylists.value.length * pageCount.value,
);

// ── Card preview (lazy, first selected playlist) ────────────────────────────────

const previewVisible = ref(false);
const previewPlaylist = computed(() => selectedPlaylistDetails.value[0] || null);
const previewNotEnough = computed(() => previewPlaylist.value?.notEnough ?? true);
const {
  cards: previewCards,
  generateCards: generatePreviewCards,
  clearCards: clearPreviewCards,
} = useBingoCards();
const previewEmptyCellCount = computed(
  () =>
    (previewCards.value[0] ?? []).filter(
      (c) => c.text !== "FREE" && !String(c.text ?? "").trim(),
    ).length,
);

function refreshPreviewCards() {
  if (!previewPlaylist.value || previewNotEnough.value) {
    clearPreviewCards();
    return;
  }
  generatePreviewCards(
    previewPlaylist.value.printableTracks.map((t) => ({ text: t.name, sub: t.artist })),
    { count: 2, hasFreeSpace: hasFreeSpace.value, gridSize: gridSize.value },
  );
}

function togglePreview() {
  if (previewVisible.value) {
    closePreview();
    return;
  }
  refreshPreviewCards();
  previewVisible.value = true;
}

function closePreview() {
  previewVisible.value = false;
  clearPreviewCards();
}

watch([previewPlaylist, gridSize, hasFreeSpace], () => {
  if (!previewVisible.value) return;
  refreshPreviewCards();
});

// ── Inline edit ────────────────────────────────────────────────────────────────

const inlineEditIds = ref(new Set());
const inlineEditState = ref({});
const inlineEditBusy = ref({});
const inlineEditError = ref({});
const inlineEditSuccess = ref({});

function isEditing(id) {
  return inlineEditIds.value.has(id);
}

function startInlineEdit(id) {
  const pl = allPlaylists.value.find((p) => p.id === id);
  if (!pl) return;
  inlineEditState.value[id] = {
    title: pl.title,
    tracks: pl.tracks.map((t) => ({
      name: String(t.name || ""),
      artist: String(t.artist || ""),
      doNotPrint: !!t.doNotPrint,
    })),
  };
  inlineEditError.value[id] = "";
  inlineEditSuccess.value[id] = false;
  inlineEditIds.value = new Set([...inlineEditIds.value, id]);
}

function cancelInlineEdit(id) {
  const next = new Set(inlineEditIds.value);
  next.delete(id);
  inlineEditIds.value = next;
}

async function saveInlineEdit(id) {
  inlineEditBusy.value[id] = true;
  inlineEditError.value[id] = "";
  inlineEditSuccess.value[id] = false;
  const state = inlineEditState.value[id];
  const rawData = getPlaylistTracksData(id);
  const tracks = state.tracks
    .filter((t) => t.name.trim())
    .map((t) => ({
      name: t.name.trim(),
      artist: t.artist.trim(),
      ...(t.doNotPrint ? { doNotPrint: true } : {}),
    }));
  const data = { ...(rawData || {}), id, title: state.title.trim() || id, tracks };
  try {
    const res = await playlistApiFetch("/api/write-playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, data }),
    });
    const json = await res.json().catch(() => ({ ok: false }));
    if (!json.ok) throw new Error(json.error || "Save failed");
    localOverrides.value = { ...localOverrides.value, [id]: { title: data.title, tracks } };
    inlineEditSuccess.value[id] = true;
    setTimeout(() => {
      inlineEditSuccess.value[id] = false;
      cancelInlineEdit(id);
    }, 1200);
  } catch (e) {
    inlineEditError.value[id] = e?.message || String(e);
  } finally {
    inlineEditBusy.value[id] = false;
  }
}

// ── Card generation (pure) ─────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(tracks, { count, gridSize: gs, hasFreeSpace: hfs }) {
  const pool = tracks.map((t) => ({ text: String(t.name || ""), sub: String(t.artist || "") }));
  const total = gs * gs;
  const includeFree = gs === 5 && hfs;
  const required = includeFree ? total - 1 : total;
  const freeIdx = Math.floor((gs * gs) / 2);
  return Array.from({ length: count }, () => {
    const selected = shuffle(pool).slice(0, required);
    if (includeFree) selected.splice(freeIdx, 0, { text: "FREE", sub: "" });
    return selected;
  });
}

// ── PDF download ───────────────────────────────────────────────────────────────

const pdfBusy = ref(false);
const pdfError = ref("");
const pdfProgress = ref({ current: 0, total: 0 });
const renderingPdf = ref(false);
const pdfEntries = ref([]);
const pdfPagesRefs = ref([]);
const { createZippedPdfBlobs } = useExport();

// ── Pre-download validation ────────────────────────────────────────────────
const showValidationModal = ref(false);
const validationIssues = ref([]);

function requestDownload() {
  if (printablePlaylists.value.length === 0) return;
  const issues = printablePlaylists.value
    .map((pl) => {
      const result = validateTracks(pl.printableTracks);
      return { title: pl.title, duplicates: result.duplicates, flagged: result.flagged };
    })
    .filter((entry) => hasValidationIssues(entry));
  if (issues.length > 0) {
    validationIssues.value = issues;
    showValidationModal.value = true;
    return;
  }
  downloadPdf();
}

function confirmDownload() {
  showValidationModal.value = false;
  downloadPdf();
}

async function downloadPdf() {
  if (printablePlaylists.value.length === 0) return;
  pdfBusy.value = true;
  pdfError.value = "";
  pdfProgress.value = { current: 0, total: 0 };
  pdfPagesRefs.value = [];

  const count = Math.max(1, Math.min(99, Math.floor(Number(cardCount.value)) || 1));

  pdfEntries.value = printablePlaylists.value.map((pl) => ({
    id: pl.id,
    title: pl.title,
    cards: buildCards(pl.printableTracks, {
      count,
      gridSize: gridSize.value,
      hasFreeSpace: hasFreeSpace.value,
    }),
  }));

  renderingPdf.value = true;

  try {
    await nextTick();
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    const entries = pdfEntries.value.map((entry, idx) => ({
      cardRefs: pdfPagesRefs.value[idx]?.getPrintPageRoots?.() ?? [],
      title: entry.title,
    }));

    const totalRoots = entries.reduce((sum, e) => sum + e.cardRefs.length, 0);
    if (!totalRoots) throw new Error("Could not prepare pages for PDF.");

    pdfProgress.value = { current: 0, total: totalRoots };

    const { blob, filename } = await createZippedPdfBlobs(entries, "letter", {
      fullPage: true,
      onProgress: (current, total) => {
        pdfProgress.value = { current, total };
      },
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    pdfError.value = e?.message || String(e);
  } finally {
    pdfBusy.value = false;
    renderingPdf.value = false;
    pdfEntries.value = [];
    pdfPagesRefs.value = [];
  }
}
</script>

<style scoped>
.batch-playlist-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

@media (max-width: 520px) {
  .batch-playlist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.batch-pl-card-wrap {
  position: relative;
}

.batch-pl-card {
  cursor: pointer;
  border-radius: 0.65rem;
  border: 2px solid transparent;
  background: rgba(15, 23, 42, 0.55);
  padding: 0;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease,
    transform 0.15s ease;
  width: 100%;
  text-align: left;
}

.batch-pl-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
}

.batch-pl-card--selected {
  border-color: #a855f7;
  box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.3),
    0 0 20px rgba(168, 85, 247, 0.18);
}

.batch-pl-card__cover {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #0f172a;
}

.batch-pl-card__check {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  background: linear-gradient(145deg, #a855f7, #9333ea);
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.6);
}

.batch-pl-card__meta {
  padding: 0.5rem 0.6rem 0.6rem;
}

.batch-pl-card__title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #fafafa;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-pl-card__count {
  margin-top: 0.1rem;
  font-size: 0.7rem;
  color: #9ca3af;
}

.batch-pl-edit-btn {
  position: absolute;
  bottom: 0.4rem;
  right: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 0.35rem;
  background: rgba(11, 14, 20, 0.8);
  color: #9ca3af;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.batch-pl-card-wrap:hover .batch-pl-edit-btn {
  opacity: 1;
}

.batch-pl-edit-btn:hover {
  color: #c084fc;
  background: rgba(168, 85, 247, 0.2);
}
</style>
