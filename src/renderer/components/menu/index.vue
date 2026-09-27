<template>
  <div class="wrapper">
    <div
      class="brand"
      aria-label="SnowRunner Studio"
    >
      <div class="brand-mark">
        SR
      </div>
      <div class="brand-copy">
        <strong>SnowRunner Studio</strong>
        <span>Editor XML en español</span>
      </div>
    </div>
    <Menu
      class="menu"
      trigger-sub-menu-action="click"
      mode="horizontal"
      :selectable="false"
      :items="items"
    />
    <Settings
      v-if="settingsHasBeenOpened"
      v-model="settingsIsOpen"
    />
    <WhatsNew
      v-if="whatsNewHasBeenOpened"
      v-model="whatsNewIsOpen"
    />
  </div>
</template>

<script lang='ts' setup>
import { Page } from '@modules/windows/enums'
import { usePageStore } from '@renderer/pages/general/store/page'
import { di } from '@utilities/di/container'
import { APP_TOKEN, ARCHIVER_TOKEN, BACKUP_TOKEN, CONFIG_TOKEN, FILES_TOKEN, MESSAGES_TOKEN, MODS_TOKEN, PATHS_TOKEN, SYSTEM_TOKEN } from '@utilities/di/renderer/tokens'
import type { ItemType, MenuProps } from 'ant-design-vue'
import { Menu } from 'ant-design-vue'
import { computed, nextTick, onMounted, ref } from 'vue'
import { Settings } from '../settings'
import { WhatsNew } from '../whats-new'
import { MENU_LOCALIZATION as texts } from './localization'

const config = di.resolve(CONFIG_TOKEN)
const system = di.resolve(SYSTEM_TOKEN)
const paths = di.resolve(PATHS_TOKEN)
const app = di.resolve(APP_TOKEN)
const backup = di.resolve(BACKUP_TOKEN)
const archiver = di.resolve(ARCHIVER_TOKEN)

const settingsHasBeenOpened = ref(false)
const settingsIsOpen = ref(false)

const whatsNewHasBeenOpened = ref(false)
const whatsNewIsOpen = ref(false)

/** Отсутствует `initial.pak`. */
const initialNotFound = !config.initialPath
const { route } = usePageStore()

/** Ссылки на медиа ресурсы. */
const links = {
	/** github.com. */
	github: 'https://github.com/OscarD0823/snowrunner'
}

/** Элементы меню. */
const items = computed(() => [
	// Файл.
	{
		key: 'file_menu',
		label: texts.fileMenuLabel,
		children: [
			...inAdvancedMode([
				{
					key: 'open_files_folder',
					label: texts.openFilesFolderItemLabel,
					disabled: initialNotFound,
					onClick: () => system.openPath(paths.mainTemp)
				},
				{
					key: 'save_files',
					label: texts.saveFilesItemLabel,
					disabled: initialNotFound,
					onClick: () => updateFiles()
				},
				{
					key: 'unpack_files',
					label: texts.unpackFilesItemLabel,
					disabled: initialNotFound,
					onClick: () => unpackFiles()
				},
				{ type: 'divider' }
			]),
			{
				key: 'exit',
				label: texts.exitMenuItemLabel,
				onClick: () => app.quit()
			}
		]
	},

	// Бэкап.
	{
		key: 'backup_menu',
		label: texts.backupMenuLabel,
		disabled: initialNotFound,
		children: [
			{
				key: 'open_backup',
				label: texts.openButton,
				onClick: () => system.openPath(paths.backupFolder)
			},
			{ type: 'divider' },
			{
				key: 'save_backup',
				label: texts.saveButton,
				onClick: () => backup.save()
			},
			{
				key: 'recover_from_backup',
				label: texts.restoreMenuItemLabel,
				onClick: () => backup.recoverFromIt()
			}
		]
	},

	// Настройки.
	{
		key: 'settings_menu',
		label: texts.settingsMenuLabel,
		children: [
			{
				key: 'open_settings',
				label: texts.settingsMenuLabel,
				disabled: initialNotFound,
				onClick: () => openSettings()
			},
			{ type: 'divider' },
			{
				key: 'reset_settings',
				label: texts.resetMenuItemLabel,
				disabled: initialNotFound,
				onClick: () => app.reset()
			},
			{
				key: 'uninstall_program',
				label: texts.uninstallMenuItemLabel,
				onClick: async () => {
					const files = di.resolve(FILES_TOKEN)

					await system.openFile(files.uninstall.path)
					app.quit()
				}
			}
		]
	},

	// Помощь.
	{
		label: texts.helpMenuLabel,
		key: 'help_menu',
		children: [
			{
				key: 'version_info',
				label: texts.versionMenuItemLabel,
				onClick: () => openWhatsNew()
			},
			{ type: 'divider' },
			{
				key: 'github',
				label: texts.githubTitle,
				onClick: () => system.openLink(links.github)
			}
		]
	}
] satisfies Required<MenuProps>['items'])

onMounted(() => {
	setTimeout(() => {
		if (config.openWhatsNew) {
			openWhatsNew()
			config.openWhatsNew = false
		}
	}, 1000)
})

function inAdvancedMode(items: ItemType[]) {
	return config.advancedMode
		? items
		: []
}

async function unpackFiles() {
	const mods = di.resolve(MODS_TOKEN)

	route(Page.none)
	await nextTick()
	await Promise.all([
		archiver.unpackMain(),
		mods.procMods()
	])
	route(Page.lists)
}

async function updateFiles() {
	const messages = di.resolve(MESSAGES_TOKEN)
	const hideLoading = messages.loading(texts.savingMessage)

	try {
		await archiver.updateFiles()
		messages.success(texts.successSaveFiles)
	} catch (error: any) {
		messages.error(error)
	}

	hideLoading()
}

function openSettings() {
	settingsHasBeenOpened.value = true
	settingsIsOpen.value = true
}

function openWhatsNew() {
	whatsNewHasBeenOpened.value = true
	whatsNewIsOpen.value = true
}
</script>

<style lang='scss' scoped>
.wrapper {
	display: flex;
	align-items: center;
	min-height: 58px;
	padding: 0 18px;
	background: #111827;
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
	z-index: 10;
}

.brand {
	display: flex;
	align-items: center;
	gap: 11px;
	min-width: 285px;
	color: white;
	user-select: none;
}

.brand-mark {
	display: grid;
	place-items: center;
	width: 36px;
	height: 36px;
	border-radius: 10px;
	background: linear-gradient(145deg, #f97316, #ea580c);
	box-shadow: 0 7px 18px rgba(234, 88, 12, 0.28);
	font-weight: 800;
	font-size: 13px;
	letter-spacing: 0.08em;
}

.brand-copy {
	display: flex;
	flex-direction: column;
	line-height: 1.15;

	strong {
		font-size: 15px;
		letter-spacing: 0.01em;
	}

	span {
		margin-top: 4px;
		color: #94a3b8;
		font-size: 11px;
	}
}

.menu {
	flex: 1;
	justify-content: flex-end;
	background: transparent;
	color: #cbd5e1;
	line-height: 58px;

	li {
		padding: 0 13px !important;
		color: #cbd5e1 !important;

		&:hover span,
		&:global(.ant-menu-submenu-active) span {
			color: white;
		}

		&:hover::after,
		&:global(.ant-menu-submenu-active::after) {
			border-bottom: 2px solid #f97316 !important;
		}

		:global(.ant-menu-submenu-title) {
			height: 58px;
			display: flex !important;
			justify-content: center;
			align-items: center;
		}
	}
}

@media (max-width: 900px) {
	.brand {
		min-width: auto;
	}

	.brand-copy span {
		display: none;
	}
}
</style>
