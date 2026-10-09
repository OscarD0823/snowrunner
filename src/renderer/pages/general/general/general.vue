<template>
  <ConfigProvider :theme="consoleTheme">
  <div id="studio-console" class="studio-shell" :class="{ 'studio-shell--editing': page === Page.editor, 'studio-shell--setup': page === Page.setup }">
  <loadingPage />
	
  <template v-if="!loading.state.isLoading">
    <Menu v-if="page !== Page.setup" />
    <EditorActions />
    <GameUpdate v-model="gameUpdateOpened" />
    <main class="studio-body">
    <Setup v-if="page === Page.setup" />
    <Lists
      v-else-if="page === Page.lists || page !== Page.none"
      v-show="page === Page.lists"
    />
    <ComponentEditor
      v-if="page === Page.editor && componentCategory && selectedFile"
      :key="`${componentCategory}:${selectedFile.path}`"
      :file="selectedFile"
      :category="componentCategory"
    />
    <Editor v-else-if="page === Page.editor" :key="selectedFile?.path" :file="selectedFile" />
    </main>
  </template>
  </div>
  </ConfigProvider>
</template>

<script lang='ts' setup>
import type { IFile } from '@modules/files/renderer'
import { Page, ProgramWindow } from '@modules/windows/enums'
import LoadingPage from '@renderer/components/loading-page.vue'
import { Menu } from '@renderer/components/menu'
import { useWindowReady } from '@renderer/utilities/use-window-ready'
import { hasItems } from '@utilities/checks/renderer'
import { di } from '@utilities/di/container'
import { CONFIG_TOKEN, DIRS_TOKEN, DLC_TOKEN, EDITED_TOKEN, FILES_TOKEN, LOADING_TOKEN, SYSTEM_TOKEN, WINDOWS_TOKEN } from '@utilities/di/renderer/tokens'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ConfigProvider, theme } from 'ant-design-vue'
import { useDecorativeVisibility } from '@renderer/utilities/use-decorative-visibility'
import { Editor } from '../editor'
import ComponentEditor from '../editor/component-editor.vue'
import { Lists } from '../lists'
import { editorUtils } from '../lists/utilities/editor'
import { Setup } from '../setup'
import { useEditorStore } from '../store/editor'
import { usePageStore } from '../store/page'
import EditorActions from './editor-actions.vue'
import GameUpdate from './game-update.vue'
import { GENERAL_LOCALIZATION as texts } from './localization'

const loading = di.resolve(LOADING_TOKEN)
const consoleTheme = {
  algorithm: theme.darkAlgorithm,
  token: { colorPrimary: '#95dce4', colorBgBase: '#0b1924', colorTextBase: '#ecf5f7', colorBorder: '#496674', borderRadius: 6, fontFamily: 'Segoe UI Variable, Segoe UI, sans-serif' }
}
const config = di.resolve(CONFIG_TOKEN)
const dirs = di.resolve(DIRS_TOKEN)
const files = di.resolve(FILES_TOKEN)

const pageStore = usePageStore()
const { route } = pageStore
const { page } = storeToRefs(pageStore)
const editorStore = useEditorStore()
const { setShowMessages } = editorStore
const { componentCategory, file: selectedFile } = storeToRefs(editorStore)

const gameUpdateOpened = ref(false)

useWindowReady(ProgramWindow.general)
useDecorativeVisibility()
useGameUpdate()
useMainRouting()

watch(
	() => config.initialPath,
	initialPath => {
		if (!initialPath) route(Page.setup)
	},
	{ immediate: true }
)

function useGameUpdate() {
	watch(
		computed(() => loading.state.isLoading),
		() => {
			const edited = di.resolve(EDITED_TOKEN)

			setTimeout(async () => {
				if (hasItems(edited)
					&& await dirs.backupInitialData.exists()
					&& !await files.editedFlag.exists()
				) {
					gameUpdateOpened.value = true
				}    
			}, 2000)
		},
		{ once: true }
	)
}

function useMainRouting() {
	let unsubscribe: () => void
	
	onMounted(() => {
		const windows = di.resolve(WINDOWS_TOKEN)

		unsubscribe = windows.onRoute(route)
	})
	onUnmounted(() => unsubscribe())
}

window['exportDefaults'] = async () => {
	const dlcs = di.resolve(DLC_TOKEN)
	const filesToExport: IFile[] = []
	const folders = ['trucks', 'trucks/trailers']

	for (const dlcItem of dlcs) {
		const classes = dlcItem.dir.dir('classes')

		for (const postfix of folders) {
			filesToExport.push(...await classes.dir(postfix).findFiles({ ext: 'xml' }))
		}
	}

	for (const postfix of folders) {
		filesToExport.push(...await dirs.classes.dir(postfix).findFiles({ ext: 'xml' }))
	}

	setShowMessages(false)

	let count = 0

	await editorUtils.export(
		filesToExport.map(file => ({ source: file, toExport: files.exported })),
		() => console.log(count++)
	)
	
	setShowMessages(true)
	
	if (await files.exported.exists()) {
		const system = di.resolve(SYSTEM_TOKEN)

		console.log(texts.exported)
		await system.openFile(files.exported.path)
	} else {
		console.error(texts.exportError)
	}
}
</script>

<style lang="scss">
body {
	background-color: var(--sr-bg);
}
</style>
