import { computed, ref, watch } from "vue";

export const MAX_EVENTS = 6;
export const DEFAULT_EVENT_COUNT = 2;
export const DEFAULT_FOOTER_TITLE = "Upcoming Events";
export const EVENTS_STORAGE_KEY = "musicBingo.printEvents";

function createEvent() {
  return { date: "", time: "", title: "" };
}

function loadStoredEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map((event) => ({
      date: event?.date ?? "",
      time: event?.time ?? "",
      title: event?.title ?? "",
    }));
  } catch {
    return null;
  }
}

export function usePrintOptions() {
  const headerImage = ref("");
  const pageCount = ref(10);
  const gridSize = ref(5);
  const hasFreeSpace = ref(false);
  const footerTitle = ref(DEFAULT_FOOTER_TITLE);
  const events = ref(
    loadStoredEvents() ??
      Array.from({ length: DEFAULT_EVENT_COUNT }, () => createEvent()),
  );

  watch(gridSize, (size) => {
    if (size === 4) hasFreeSpace.value = false;
  });

  watch(
    events,
    (value) => {
      try {
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(value));
      } catch {
        // ignore storage errors (e.g. private browsing quota)
      }
    },
    { deep: true },
  );

  function addEvent() {
    if (events.value.length >= MAX_EVENTS) return;
    events.value.push(createEvent());
  }

  function removeEvent(idx) {
    events.value.splice(idx, 1);
  }

  function clearEvents() {
    events.value = [createEvent()];
  }

  const cardCount = computed(() => Math.max(1, pageCount.value) * 2);

  const minTracks = computed(() => {
    if (gridSize.value === 4) return 16;
    return hasFreeSpace.value ? 24 : 25;
  });

  function onHeaderImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      headerImage.value = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function removeHeaderImage() {
    headerImage.value = "";
  }

  return {
    headerImage,
    pageCount,
    cardCount,
    gridSize,
    hasFreeSpace,
    footerTitle,
    events,
    minTracks,
    onHeaderImageChange,
    removeHeaderImage,
    addEvent,
    removeEvent,
    clearEvents,
  };
}
