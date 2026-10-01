<template>
  <div ref="container" class="tire-preview" :title="texts.previewHint">
    <img v-if="src" :src="src" :alt="texts.preview" decoding="async">
    <svg v-else viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="43" /><circle cx="60" cy="60" r="23" /><circle cx="60" cy="60" r="7" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { COMPONENT_PRESENTATION_TEXTS as texts } from '@renderer/utilities/component-presentation'
import type { TirePreviewOptions } from '@renderer/utilities/preview-3d'

const props = defineProps<TirePreviewOptions>()
const src = ref<string>()
const container = ref<HTMLElement>()
let observer: IntersectionObserver | undefined
let visible = false
let request = 0
async function render() {
  const current = ++request
  const { renderTire } = await import('@renderer/utilities/preview-3d')
  if (current === request) src.value = renderTire(props)
}
onMounted(() => {
  observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return
    visible = true
    void render()
    observer?.disconnect()
  }, { rootMargin: '100px' })
  if (container.value) observer.observe(container.value)
})
watch(() => [props.radius, props.width, props.pattern], () => { if (visible) void render() })
onBeforeUnmount(() => { request++; observer?.disconnect() })
</script>

<style scoped>
.tire-preview { display: grid; width: 100%; height: 100%; min-height: 140px; place-items: center; }
img { width: 100%; height: 100%; object-fit: contain; }
svg { width: 65%; height: 65%; fill: none; stroke: #b8ccd5; stroke-width: 8; }
</style>
