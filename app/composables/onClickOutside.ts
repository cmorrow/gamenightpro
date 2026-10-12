/** Calls `handler` on a mousedown outside `target`. */
export function onClickOutside(target: Ref<HTMLElement | undefined>, handler: () => void) {
  const listener = (e: MouseEvent) => {
    if (target.value && !target.value.contains(e.target as Node)) handler()
  }
  onMounted(() => document.addEventListener('mousedown', listener))
  onUnmounted(() => document.removeEventListener('mousedown', listener))
}
