<template>
  <section class="vehicle-preview" :aria-label="name">
    <div class="vehicle-preview__summary">
      <img :src="src" :alt="name" :title="representative ? texts.preview : name" @error="useDefault">
      <div class="vehicle-preview__info">
        <strong>{{ name }}</strong>
        <p v-if="description" :title="description">{{ description }}</p>
        <small v-if="representative">{{ texts.preview }}</small>
      </div>
      <slot name="actions" />
    </div>
    <div id="editor-preview-panel" class="vehicle-preview__viewer">
      <VehicleDrive :xml="xml" :name="name" :image="src" :preview-context="previewContext" :selected-tire="selectedTire" :selected-suspension="selectedSuspension" />
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
import VehicleDrive from '@renderer/components/vehicle-drive.vue'
import type { VehiclePreviewContext } from '@renderer/utilities/vehicle-appearance'

const props = defineProps<{ file: IFile; xml: TruckXML; previewContext?: VehiclePreviewContext }>()
const selectedTire = ref<string>(), selectedSuspension = ref<string>()
defineExpose({ tire: (mesh: string) => { selectedTire.value = mesh }, suspension: (name: string) => { selectedSuspension.value = name } })
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
.vehicle-preview { display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: 10px; border: 1px solid #dbe4ed; border-radius: 12px; background: linear-gradient(120deg, #fff, #eef4f8); container-type: inline-size; }
.vehicle-preview__summary { display: flex; flex: 0 0 auto; align-items: center; gap: 14px; min-width: 0; }
.vehicle-preview__viewer { display: flex; flex: 1 1 0; min-height: 0; min-width: 0; margin-top: 8px; }
.vehicle-preview__info { flex: 1; min-width: 0; }
img { width: 66px; height: 54px; flex: 0 0 auto; object-fit: contain; }
strong { display: block; color: #162439; font-size: 17px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
p { max-width: 800px; margin: 6px 0; color: #526176; font-size: 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
small { color: #687b91; }
@container (max-width: 320px) { img { width: 40px; height: 38px; } strong { font-size: 13px; white-space: normal; } p { display: none; } .vehicle-preview__summary { gap: 6px; } }
@media (max-height: 650px) { p { -webkit-line-clamp: 1; font-size: 11px; } }
</style>
