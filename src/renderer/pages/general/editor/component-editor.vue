<template>
  <div class="component-editor">
    <Header
      :text="title"
      with-back
      @back="goBack"
    >
      <template #extra>
        <Button
          type="primary"
          class="save-button"
          :loading="isSaving"
          @click="save"
        >
          <SaveOutlined />
          <span>{{ texts.save }}</span>
        </Button>
      </template>
    </Header>
    <div class="component-editor__body">
      <div class="component-editor__intro">
        <strong>{{ categoryTitle }}</strong>
        <span>{{ texts.description }}</span>
      </div>
      <Spin
        v-if="isLoading"
        center
      />
      <Alert
        v-else-if="hasError"
        type="error"
        show-icon
        :message="texts.error"
      />
      <EngineSet
        v-else-if="engines"
        :xml="engines"
        :file="file"
      />
      <WheelsSet
        v-else-if="wheels"
        :xml="wheels"
        :file="file"
      />
      <WinchSet
        v-else-if="winches"
        :xml="winches"
        :file="file"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { SaveOutlined } from '@ant-design/icons-vue'
import type { IFile } from '@modules/files/types'
import { Page } from '@modules/windows/enums'
import { Engines, Wheels, WinchVariants } from '@modules/xml/renderer'
import Header from '@renderer/components/header.vue'
import Spin from '@renderer/components/spin.vue'
import { useKey } from '@renderer/utilities/use-key'
import { prettyString } from '@utilities/strings/renderer'
import { di } from '@utilities/di/container'
import { ARCHIVER_TOKEN, DLC_TOKEN, EDITED_TOKEN, MESSAGES_TOKEN, MODS_TOKEN } from '@utilities/di/renderer/tokens'
import { Alert, Button } from 'ant-design-vue'
import { computed, onMounted, ref, shallowRef } from 'vue'
import { Category, type ComponentCategory } from '../enums'
import { useEditorStore } from '../store/editor'
import { usePageStore } from '../store/page'
import EngineSet from './components/tables/engines/set.vue'
import WheelsSet from './components/tables/wheels/set.vue'
import WinchSet from './components/tables/winches/set.vue'
import { saveUtils } from './utilities/save'
import { COMPONENT_EDITOR_LOCALIZATION as texts } from './component-localization'

type Props = {
	file: IFile
	category: ComponentCategory
}

const props = defineProps<Props>()
const { route } = usePageStore()
const editorStore = useEditorStore()
const isLoading = ref(true)
const isSaving = ref(false)
const hasError = ref(false)
const engines = shallowRef<Engines | null>(null)
const wheels = shallowRef<Wheels | null>(null)
const winches = shallowRef<WinchVariants | null>(null)

const title = prettyString(props.file.name)
const categoryTitle = computed(() => ({
	[Category.engines]: texts.engines,
	[Category.wheels]: texts.wheels,
	[Category.winches]: texts.winches
})[props.category])

const mods = di.resolve(MODS_TOKEN)
editorStore.setInfo({
	dlc: di.resolve(DLC_TOKEN).getDLC(props.file),
	mod: mods.getModID(props.file)
})

onMounted(load)
useKey('Escape', () => route(Page.lists))

function goBack() {
	route(Page.lists)
}

async function load() {
	try {
		if (props.category === Category.engines) {
			engines.value = await Engines.from(props.file) ?? null
		} else if (props.category === Category.wheels) {
			wheels.value = await Wheels.from(props.file) ?? null
		} else {
			winches.value = await WinchVariants.from(props.file) ?? null
		}

		hasError.value = !engines.value && !wheels.value && !winches.value
	} catch {
		hasError.value = true
	} finally {
		isLoading.value = false
	}
}

async function save() {
	if (isSaving.value || hasError.value) return

	isSaving.value = true
	const messages = di.resolve(MESSAGES_TOKEN)
	try {
		await saveUtils.emitSave()
		const archiver = di.resolve(ARCHIVER_TOKEN)
		const mod = mods.getModID(props.file)
		if (mod) await archiver.updateFiles(mod)
		else await archiver.updateFiles()

		di.resolve(EDITED_TOKEN).markAsEdited(props.file)
		messages.success(texts.saved)
	} catch (error: any) {
		messages.error(error)
	} finally {
		isSaving.value = false
	}
}
</script>

<style lang="scss" scoped>
.component-editor {
	display: flex;
	min-height: 0;
	flex: 1 1 0;
	flex-direction: column;
	background: var(--sr-bg);

	&__body {
		min-height: 0;
		padding: 20px;
		flex: 1 1 0;
		overflow-y: auto;
	}

	&__intro {
		display: flex;
		margin-bottom: 14px;
		padding: 14px 16px;
		flex-direction: column;
		gap: 3px;
		color: #9a3412;
		background: #fff7ed;
		border: 1px solid #fed7aa;
		border-radius: 10px;

		span { color: #64748b; font-size: 12px; }
	}
}

.save-button {
	display: inline-flex;
	align-items: center;
	gap: 7px;
	height: 38px;
	border-radius: 9px;
	font-weight: 650;
}

@media (max-width: 700px) {
	.component-editor__body { padding: 12px; }
	.save-button span { display: none; }
}
</style>
