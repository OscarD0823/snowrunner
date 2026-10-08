<template>
  <div class="lists">
    <section class="library-heading">
      <div class="library-heading__title">
        <h1>{{ categoryTitle }}</h1>
        <span>{{ files[SourceType.all].length }} {{ texts.resultCount }}</span>
      </div>
      <div class="library-heading__actions">
        <Tooltip :title="texts.rescanButton">
          <Button
            class="rescan-button"
            type="primary"
            :loading="isScanning"
            @click="scanNewContent"
          >
            <SyncOutlined v-if="!isScanning" />
            <span>{{ texts.rescanButton }}</span>
          </Button>
        </Tooltip>
        <Tooltip :title="texts.filtersButton">
          <Button
            class="header-button"
            :aria-label="texts.filtersButton"
            @click="toggleFiltersPanel"
          >
            <FilterOutlined class="button-icon" />
            <span>{{ texts.filtersButton }}</span>
          </Button>
        </Tooltip>
      </div>
    </section>

    <div class="quick-sections">
      <div class="quick-sections__group">
        <span class="quick-sections__label">{{ texts.librarySections }}</span>
        <Segmented
          :value="source"
          :options="quickSections"
          @change="setSource($event as SourceType)"
        />
      </div>
      <div class="quick-sections__group quick-sections__group--view">
        <span class="quick-sections__label">{{ texts.viewLabel }}</span>
        <Segmented
          :value="listMode"
          :options="viewSections"
          @change="setListMode($event as ListMode)"
        />
      </div>
    </div>
    <Filters :is-open="filtersIsOpen" />
    <div
      v-if="isLoadingFiles"
      class="library-loading"
    >
      <Spin size="large" />
      <span>{{ texts.loadingLibrary }}</span>
    </div>
    <List v-else />
  </div>
</template>

<script lang='ts' setup>
import { AppstoreOutlined, FilterOutlined, MenuOutlined, SyncOutlined } from '@ant-design/icons-vue'
import type { IFile } from '@modules/files/renderer'
import { useKey } from '@renderer/utilities/use-key'
import { refreshComponentPresentation } from '@renderer/utilities/component-presentation'
import { di } from '@utilities/di/container'
import { APP_TOKEN, CHECKS_TOKEN, DLC_TOKEN, IMAGES_TOKEN, MESSAGES_TOKEN, MODS_TOKEN } from '@utilities/di/renderer/tokens'
import { Button, Segmented, Spin, Tooltip } from 'ant-design-vue'
import { storeToRefs } from 'pinia'
import { computed, h, onMounted, ref, watch } from 'vue'
import { Category, ListMode, SourceType } from '../enums'
import { useListStore } from '../store/list'
import Filters from './components/filters.vue'
import List from './components/list/list.vue'
import { LISTS_LOCALIZATION as texts } from './localization'
import { ItemsUtils } from './utilities/items'

const app = di.resolve(APP_TOKEN)
const listStore = useListStore()
const { files, category, listMode, source } = storeToRefs(listStore)
const { clearFiles, setListMode, setSource } = listStore

const quickSections = computed(() => [
	{ label: `${texts.allSource} (${files.value[SourceType.all].length})`, value: SourceType.all },
	{ label: `${texts.mainSource} (${files.value[SourceType.main].length})`, value: SourceType.main },
	{ label: `${texts.dlcSource} (${files.value[SourceType.dlc].length})`, value: SourceType.dlc },
	{ label: `${texts.editedSource} (${files.value[SourceType.edited].length})`, value: SourceType.edited },
	{ label: `${texts.favoritesSource} (${files.value[SourceType.favorites].length})`, value: SourceType.favorites },
	{ label: `${texts.modsSource} (${files.value[SourceType.mods].length})`, value: SourceType.mods }
])

const viewSections = computed(() => [
	{
		label: h('span', { class: 'view-option' }, [h(AppstoreOutlined), texts.cardsView]),
		value: ListMode.cards
	},
	{
		label: h('span', { class: 'view-option' }, [h(MenuOutlined), texts.listView]),
		value: ListMode.list
	}
])

const categoryTitle = computed(() => ({
	[Category.trucks]: texts.trucksListTitle,
	[Category.trailers]: texts.trailersListTitle,
	[Category.engines]: texts.enginesListTitle,
	[Category.wheels]: texts.wheelsListTitle,
	[Category.winches]: texts.winchesListTitle
})[category.value])

const filtersIsOpen = ref(true)
const isScanning = ref(false)
const isLoadingFiles = ref(false)
let loadRequest = 0

watch(category, async () => {
	await loadFiles()
})

useKey('Escape', () => app.quit())
onMounted(async () => {
	if (files.value[SourceType.main].length === 0) {
		await loadFiles()
	}
})

async function loadFiles() {
	const request = ++loadRequest
	const requestedCategory = category.value

	isLoadingFiles.value = true
	clearFiles()
	const itemsUtils = new ItemsUtils()

	try {
		const [main, dlc, mods] = await Promise.all([
			itemsUtils.getMain(requestedCategory),
			itemsUtils.getDLC(requestedCategory),
			itemsUtils.getMods(requestedCategory)
		])

		if (request !== loadRequest || requestedCategory !== category.value) {
			return
		}

		addFiles(SourceType.main, main)
		addFiles(SourceType.dlc, dlc)
		addFiles(SourceType.mods, mods)
	} finally {
		if (request === loadRequest) {
			isLoadingFiles.value = false
		}
	}
}

async function scanNewContent() {
	if (isScanning.value) {
		return
	}

	isScanning.value = true
	const messages = di.resolve(MESSAGES_TOKEN)
	const hideLoading = messages.loading(texts.scanningContent)

	try {
		const checks = di.resolve(CHECKS_TOKEN)
		const dlc = di.resolve(DLC_TOKEN)
		const mods = di.resolve(MODS_TOKEN)

		// Solo vuelve a extraer initial.pak si el juego cambió. Así, una búsqueda
		// normal de mods es rápida y las actualizaciones del juego siguen entrando.
		await checks.checkInitialChanges()
		await dlc.init()
		await mods.procMods()
		di.resolve(IMAGES_TOKEN).refresh()
		refreshComponentPresentation()
		listStore.itemsCache.clear()
		clearFiles()
		await loadFiles()
		messages.success(texts.rescanComplete)
	} catch (error: any) {
		messages.error(error)
	} finally {
		hideLoading()
		isScanning.value = false
	}
}

function addFiles(sourceType: SourceType, newFiles: IFile[]) {
	files.value[sourceType].push(...newFiles)
	files.value[sourceType].sort(sortByName)
}

function sortByName(a: IFile, b: IFile) {
	return a.name.localeCompare(b.name)
}

function toggleFiltersPanel() {
	filtersIsOpen.value = !filtersIsOpen.value
}

</script>

<style lang='scss'>
.ant-tabs-nav-list {
	justify-content: space-evenly;
	width: 100%;
}

.ant-btn-circle,
.anticon-arrow-left,
.anticon-menu.menu-button.ant-dropdown-trigger {
	color: white;
	background: inherit;
	border: none;

	&:hover {
		color: lightgray !important;
	}
}
</style>

<style lang='scss' scoped>
.lists {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	min-height: 0;
	background: #eef2f7;
  .library-journey { width: 220px; flex: 0 1 220px; border-radius: 9px; }
  @media (max-width: 900px) { .library-journey { width: 125px; flex-basis: 125px; } }

	.library-heading {
		display: flex;
		align-items: center;
		gap: 16px;
		min-height: 62px;
		padding: 10px 20px;
		background: #f9fbfc;
		border-bottom: 1px solid var(--sr-border);

		&__title {
			display: flex;
			align-items: baseline;
			gap: 10px;
			min-width: 0;

			h1 {
				margin: 0;
				color: #172033;
				font-size: 21px;
				line-height: 1.2;
			}

			span {
				color: #64748b;
				font-size: 11px;
				white-space: nowrap;
			}
		}

		&__actions {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-left: auto;
		}

		@media (max-width: 700px) {
			min-height: 54px;
			padding: 8px 12px;

			&__title {
				align-items: flex-start;
				flex-direction: column;
				gap: 2px;

				h1 { font-size: 18px; }
			}

			&__actions span { display: none; }
		}
	}

	.header-button {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		height: 36px;
		color: #435166;
		background: white;
		border-color: #d6dee6;

		&:hover,
		&:focus-visible {
			color: #c4520a;
			background: #fff9f4;
			border-color: #fb923c;
		}

		.button-icon {
			font-size: 16px;
		}
	}

	.library-loading {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		color: #64748b;
		font-size: 13px;
	}

	.rescan-button {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		height: 36px;
		border-radius: 9px;
		font-weight: 650;
	}

	.quick-sections {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 12px 20px;
		background: #f8fafc;
		border-bottom: 1px solid var(--sr-border);

		&__group {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		&__group--view {
			margin-left: auto;
		}

		&__label {
			color: #64748b;
			font-size: 11px;
			font-weight: 700;
			letter-spacing: 0.04em;
			text-transform: uppercase;
		}

		:deep(.ant-segmented-item-selected) {
			color: #c2410c;
			font-weight: 650;
		}

		:deep(.view-option) {
			display: inline-flex;
			align-items: center;
			gap: 6px;
		}

		@media (max-width: 1050px) {
			align-items: stretch;
			flex-direction: column;

			&__group {
				justify-content: space-between;
			}

			&__group--view {
				margin-left: 0;
			}
		}

		@media (max-width: 700px) {
			gap: 7px;
			padding: 8px 12px;

			&__label { display: none; }
			&__group { overflow-x: auto; }
			:deep(.ant-segmented) { min-width: max-content; }
		}
	}
}

</style>
