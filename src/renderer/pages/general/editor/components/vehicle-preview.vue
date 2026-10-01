<template>
  <section class="vehicle-preview">
    <img :src="src" :alt="name" :title="representative ? texts.preview : name" @error="useDefault">
    <div>
      <strong>{{ name }}</strong>
      <p v-if="description">{{ description }}</p>
      <small v-if="representative">{{ texts.preview }}</small>
    </div>
  </section>
</template>
<script setup lang="ts">
import type { IFile } from '@modules/files/types'
import { TruckFileType, type TruckXML } from '@modules/xml/renderer'
import { Category } from '@renderer/pages/general/enums'
import { COMPONENT_PRESENTATION_TEXTS as texts } from '@renderer/utilities/component-presentation'
import { di } from '@utilities/di/container'
import { GAME_TEXTS_TOKEN, IMAGES_TOKEN, MODS_TOKEN } from '@utilities/di/renderer/tokens'
import { prettyString } from '@utilities/strings/renderer'
import { computed, ref, watch } from 'vue'

const props = defineProps<{ file: IFile; xml: TruckXML }>()
const images = di.resolve(IMAGES_TOKEN)
const gameTexts = di.resolve(GAME_TEXTS_TOKEN)
const mod = di.resolve(MODS_TOKEN).getModID(props.file)
const category = computed(() => props.xml.Type === TruckFileType.trailer || /[\\/]trucks[\\/]trailers[\\/]/i.test(props.file.path) ? Category.trailers : Category.trucks)
const src = ref(images.getDefault(category.value))
const representative = computed(() => src.value.startsWith('data:'))
const name = computed(() => gameTexts.get(props.xml.GameData?.UiDesc?.displayName, mod) ?? prettyString(props.file.name))
const description = computed(() => gameTexts.get(props.xml.GameData?.UiDesc?.displayDescription, mod))
watch(() => props.xml, async xml => {
  try { src.value = await images.getSrc(category.value, props.file, xml) }
  catch { useDefault() }
}, { immediate: true })
function useDefault() { src.value = images.getDefault(category.value) }
</script>
<style scoped>
.vehicle-preview { display: flex; flex: 0 0 auto; align-items: center; gap: 18px; margin: 12px 20px 0; padding: 10px 18px; border: 1px solid #dbe4ed; border-radius: 14px; background: linear-gradient(120deg, #fff, #eef4f8); }
img { width: 110px; height: 118px; flex: 0 0 auto; object-fit: contain; }
strong { color: #162439; font-size: 17px; }
p { max-width: 800px; margin: 6px 0; color: #526176; font-size: 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
small { color: #687b91; }
@media (max-width: 760px), (max-height: 650px) { .vehicle-preview { gap: 12px; margin: 8px 12px 0; padding: 6px 12px; } img { width: 75px; height: 80px; } strong { font-size: 14px; } p { -webkit-line-clamp: 2; font-size: 11px; } }
</style>
