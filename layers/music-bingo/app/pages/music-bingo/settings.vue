<template>
  <main class="h-full overflow-auto p-6">
    <section class="mx-auto flex max-w-[900px] flex-col gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-5">
      <h2 class="text-2xl font-bold text-slate-100">Settings</h2>
      <p class="text-slate-300">Choose the Spotify playback device used by Games.</p>

      <div v-if="!spotifyToken" class="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
        <p>Connect Spotify to load available devices.</p>
        <button class="mt-2 rounded-lg bg-[var(--brand-success)] px-3 py-2 font-bold text-white disabled:opacity-60" :disabled="!clientIdConfigured" @click="connectSpotify">
          Authorize with Spotify
        </button>
      </div>

      <template v-else>
        <div class="flex flex-wrap gap-2">
          <button class="rounded-lg bg-[var(--brand-success)] px-3 py-2 font-bold text-white disabled:opacity-60" :disabled="loadingDevices" @click="loadDevices">
            {{ loadingDevices ? "Loading..." : "Refresh Devices" }}
          </button>
          <button class="rounded-lg bg-slate-700 px-3 py-2 font-bold text-slate-100 disabled:opacity-60" :disabled="!selectedDeviceId" @click="clearSelectedDevice">
            Clear Preferred Device
          </button>
        </div>

        <p v-if="errorMessage" class="text-rose-300">{{ errorMessage }}</p>
        <p v-if="!devices.length" class="text-slate-400">No controllable devices found. Open Spotify on a device and refresh.</p>

        <div v-if="devices.length" class="flex flex-col gap-2">
          <label v-for="device in devices" :key="device.id || device.name" class="flex items-start gap-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
            <input
              type="radio"
              name="preferred-device"
              :value="device.id"
              :checked="selectedDeviceId === device.id"
              :disabled="!device.id || device.is_restricted"
              @change="onSelectDevice(device.id)"
            />
            <div>
              <p class="font-bold text-slate-100">
                {{ device.name }} <span v-if="device.is_active" class="ml-1 rounded-full bg-green-200 px-2 py-0.5 text-[11px] text-green-800">Active</span>
              </p>
              <p class="text-sm text-slate-300">
                {{ device.type }} · {{ device.is_restricted ? "Restricted" : "Controllable" }}
              </p>
              <p class="text-sm text-slate-400">ID: {{ device.id || "(none)" }}</p>
            </div>
          </label>
        </div>
      </template>
    </section>
  </main>
</template>

<script setup>
definePageMeta({ name: "mb-settings", layout: "music-bingo" });

import { onMounted, ref } from "vue";
import {
  fetchAvailableDevices,
  getPreferredSpotifyDeviceId,
  getStoredToken,
  handleSpotifyCallback,
  hasClientId,
  setPreferredSpotifyDeviceId,
  startSpotifyAuth,
} from "../../composables/useSpotify.js";

const devices = ref([]);
const loadingDevices = ref(false);
const errorMessage = ref("");
const spotifyToken = ref(getStoredToken());
const selectedDeviceId = ref(getPreferredSpotifyDeviceId());
const clientIdConfigured = hasClientId();

async function loadDevices() {
  if (!spotifyToken.value) return;
  loadingDevices.value = true;
  errorMessage.value = "";
  try {
    devices.value = await fetchAvailableDevices(spotifyToken.value);
    if (
      selectedDeviceId.value &&
      !devices.value.some((device) => device.id === selectedDeviceId.value)
    ) {
      selectedDeviceId.value = "";
      setPreferredSpotifyDeviceId("");
    }
  } catch (error) {
    errorMessage.value = error.message || "Unable to load devices.";
  } finally {
    loadingDevices.value = false;
  }
}

async function connectSpotify() {
  errorMessage.value = "";
  try {
    await startSpotifyAuth();
    spotifyToken.value = getStoredToken();
    if (spotifyToken.value) {
      await loadDevices();
    }
  } catch (e) {
    errorMessage.value = e?.message || "Spotify authorization failed.";
  }
}

function onSelectDevice(deviceId) {
  selectedDeviceId.value = String(deviceId || "");
  setPreferredSpotifyDeviceId(selectedDeviceId.value);
}

function clearSelectedDevice() {
  selectedDeviceId.value = "";
  setPreferredSpotifyDeviceId("");
}

onMounted(async () => {
  if (window.location.search.includes("code=")) {
    try {
      await handleSpotifyCallback();
      spotifyToken.value = getStoredToken();
    } catch (error) {
      errorMessage.value = error.message;
    }
  }
  if (spotifyToken.value) {
    await loadDevices();
  }
});
</script>
