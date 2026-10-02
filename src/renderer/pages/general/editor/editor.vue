<template>
  <div class="container" :data-editor-view="view">
    <EditorHeader
      ref="header"
      :xml="xml"
      :file="file"
      :has-error="hasError"
    />
    <VehiclePreview v-if="xml" ref="preview" :xml="xml" :file="file" :expanded="view === 'preview'" :preview-context="previewContext">
      <template #actions>
        <nav class="editor-view-tabs" role="tablist" :aria-label="viewTexts.navigation" :title="viewTexts.hint">
          <button
            id="editor-settings-tab"
            role="tab"
            :aria-selected="view === 'settings'"
            aria-controls="editor-settings-panel"
            :tabindex="view === 'settings' ? 0 : -1"
            @click="view = 'settings'"
            @keydown.right.prevent="focusView('preview')"
            @keydown.left.prevent="focusView('preview')"
            @keydown.home.prevent="focusView('settings')"
            @keydown.end.prevent="focusView('preview')"
          >{{ viewTexts.settings }}</button>
          <button
            id="editor-preview-tab"
            role="tab"
            :aria-selected="view === 'preview'"
            aria-controls="editor-preview-panel"
            :tabindex="view === 'preview' ? 0 : -1"
            @click="view = 'preview'"
            @keydown.right.prevent="focusView('settings')"
            @keydown.left.prevent="focusView('settings')"
            @keydown.home.prevent="focusView('settings')"
            @keydown.end.prevent="focusView('preview')"
          >{{ viewTexts.preview }}</button>
        </nav>
      </template>
    </VehiclePreview>
    <Table
      v-if="xml"
      v-show="view === 'settings'"
      id="editor-settings-panel"
      role="tabpanel"
      aria-labelledby="editor-settings-tab"
      tabindex="0"
      :xml="xml"
      :file="file"
      @ready="$emit('ready')"
      @preview-context="previewContext = $event"
    />
    <Spin
      v-else-if="!hasError"
      center
    />
  </div>
</template>

<script lang='ts' setup>
import type { IFile } from '@modules/files/renderer'
import { Page } from '@modules/windows/enums'
import { TruckXML } from '@modules/xml/renderer'
import Spin from '@renderer/components/spin.vue'
import { useKey } from '@renderer/utilities/use-key'
import { di } from '@utilities/di/container'
import { DIRS_TOKEN, DLC_TOKEN, MODS_TOKEN } from '@utilities/di/renderer/tokens'
import { storeToRefs } from 'pinia'
import { nextTick, onMounted, provide, ref, shallowRef } from 'vue'
import { VEHICLE_APPEARANCE, type VehiclePreviewContext } from '@renderer/utilities/vehicle-appearance'
import { loadLocalization, Localization, LocalizationStrings } from '@localization/renderer'
import { useEditorStore } from '../store/editor'
import { usePageStore } from '../store/page'
import EditorHeader from './components/header/editor-header.vue'
import VehiclePreview from './components/vehicle-preview.vue'
import Table from './components/tables/table.vue'
import type { ReadyEmits, ReadyProps } from './components/utilities'
import { filesUtils } from './utilities/files'
import { provideFile } from './utilities/import'
import { resetUtils } from './utilities/reset'

export type EditorProps = Props & ReadyProps

type Props = {
	/** Файл для редактирования. */
	file?: IFile
}
type HeaderExpose = InstanceType<typeof EditorHeader>

const props = defineProps<Props>()
const emit = defineEmits<ReadyEmits>()
defineExpose({
	async save(...args: Parameters<HeaderExpose['save']>) {
		return header.value?.save(...args)
	},
	async export(...args: Parameters<HeaderExpose['export']>) {
		return header.value?.export(...args)
	},
	async reset(updateFiles = true) {
		await header.value?.reset()
		return header.value?.save(updateFiles)
	},
	async import(updateFiles = true, ...args: Parameters<HeaderExpose['import']>) {
		await header.value?.import(...args)
		return header.value?.save(updateFiles)
	}
})

const editorStore = useEditorStore()
const { file: prevFile, allFiles } = storeToRefs(editorStore)
const { setInfo } = editorStore
const { route } = usePageStore()

const xml = shallowRef<TruckXML | null>(null)
const header = ref<InstanceType<typeof EditorHeader> | null>(null)
const hasError = ref<boolean>(false)
const view = ref<'settings' | 'preview'>('settings')
const previewContext = ref<VehiclePreviewContext>()
const viewTexts = loadLocalization(new Localization({
  settings: new LocalizationStrings().es('Ajustes').en('Settings'),
  preview: new LocalizationStrings().es('Visor del vehículo').en('Vehicle viewer'),
  navigation: new LocalizationStrings().es('Vistas del editor').en('Editor views'),
  hint: new LocalizationStrings().es('Los cambios se mantienen al cambiar de pestaña.').en('Changes are kept when switching tabs.')
}))
const preview = ref<InstanceType<typeof VehiclePreview>>()
provide(VEHICLE_APPEARANCE, { tire: mesh => preview.value?.tire(mesh), suspension: name => preview.value?.suspension(name) })

async function focusView(value: 'settings' | 'preview') {
  view.value = value
  await nextTick()
  document.getElementById(value === 'settings' ? 'editor-settings-tab' : 'editor-preview-tab')?.focus()
}

const file = (props.file ?? prevFile.value)!

onMounted(init)
filesUtils.watch(update, [file])
useKey('Escape', () => route(Page.lists))

const dlcs = di.resolve(DLC_TOKEN)
const mods = di.resolve(MODS_TOKEN)
const dirs = di.resolve(DIRS_TOKEN)

setInfo({
	dlc: dlcs.getDLC(file),
	mod: mods.getModID(file),
	isBackup: file.path.includes(dirs.backupInitialData.name)
})

regFile(file)
provideFile(file)
resetUtils.provide(resetUtils.globalID)

async function init() {
	let result: TruckXML | undefined
	try { result = await TruckXML.from(file) } catch (error) { console.warn('No se pudo leer el vehículo.', error) }

	if (result) {
		xml.value = result
		hasError.value = false
	} else {
		hasError.value = true
		xml.value = null
		emit('ready')
	}
}

async function update() {
	previewContext.value = undefined
	xml.value = null

	await nextTick()
	await init()
}

function regFile(file: IFile) {
	allFiles.value.main = file
}
</script>

<style lang='scss'>
.ant-space {
	gap: 20px !important;
}

.ant-tabs-content {
	height: 100% !important;
}

div.ant-collapse {
	border-radius: 0;

	&-header {
		height: 45px;
		background-color: #f7f7f7;
		border-radius: 0 !important;
	}

	&-content,
	&-item:last-child {
		border-radius: 0 !important;
	}
}
</style>

<style lang='scss' scoped>
@mixin header-button {
	color: white;
	font-size: 25px !important;
}

.container,
.tabs {
	min-height: 0;
}

.container {
	display: flex;
	flex: 1 1 0;
	flex-direction: column;
  overflow: hidden;

  > header { flex: 0 0 auto; }
}

.editor-view-tabs {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 6px;
  padding: 0;
  min-width: 0;

  button {
    padding: 9px 12px;
    border: 1px solid #dbe4ed;
    border-radius: 9px;
    background: #fff;
    color: #526176;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }
  button[aria-selected='true'] { background: #fff2e5; border-color: #fb923c; color: #9a3412; font-weight: 650; }
  button:focus-visible { outline: 2px solid #ea580c; outline-offset: 2px; }
}

.spin-container {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.error-container {
	padding: 0 30px;
	margin-top: 100px;
	text-align: center;
}

:global(span.anticon-arrow-left) {
	@include header-button;
}
</style>
