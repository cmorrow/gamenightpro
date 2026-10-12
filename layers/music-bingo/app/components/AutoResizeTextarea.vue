<template>
  <textarea
    ref="textareaRef"
    :value="modelValue"
    rows="1"
    class="w-full resize-none overflow-hidden rounded-lg border border-white/15 bg-[#0b0e14] px-3 py-2 text-sm text-white outline-none placeholder:text-[#374151] focus:border-[#a855f7]/60"
    :placeholder="placeholder"
    @input="onInput"
  />
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import { resizeTextarea } from "../composables/useAutoResizeTextarea.js";

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);

const textareaRef = ref(null);

function resize() {
  resizeTextarea(textareaRef.value);
}

function onInput(e) {
  emit("update:modelValue", e.target.value);
  resize();
}

onMounted(() => nextTick(resize));
watch(
  () => props.modelValue,
  () => nextTick(resize),
);
</script>
