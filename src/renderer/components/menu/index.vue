<template>
  <div class="wrapper">
    <header class="topbar">
      <div
        class="brand"
        aria-label="SnowRunner Studio"
      >
        <div class="brand-mark">
          <img
            :src="appIconUrl"
            alt=""
          >
        </div>
        <div class="brand-copy">
          <strong>SnowRunner Studio</strong>
          <nav class="project-links" :aria-label="texts.projectLinks">
            <a :href="links.profile" target="_blank" rel="noopener noreferrer" data-project-link="profile" :title="texts.githubAuthor" @click.prevent="system.openLink(links.profile)"><GithubOutlined />@OscarD0823</a>
            <a :href="links.github" target="_blank" rel="noopener noreferrer" data-project-link="repository" :title="texts.githubRepository" :aria-label="texts.githubRepository" @click.prevent="system.openLink(links.github)">Repo ↗</a>
          </nav>
        </div>
      </div>
      <GameBrief />
      <div class="topbar__actions">
        <Language compact />
        <Tooltip :title="texts.settingsMenuLabel">
          <Button
            class="topbar-button"
            type="text"
            :aria-label="texts.settingsMenuLabel"
            @click="openSettings"
          >
            <SettingOutlined />
          </Button>
        </Tooltip>
        <Menu
          class="menu"
          trigger-sub-menu-action="click"
          mode="horizontal"
          :selectable="false"
          :items="items"
        />
      </div>
    </header>
    <section v-if="pageStore.page !== Page.editor" class="workspace-bar">
      <nav
        class="workspace-navigation"
        :aria-label="texts.brandSubtitle"
      >
        <button
          v-for="item in workspaceItems"
          :key="item.key"
          type="button"
          class="workspace-navigation__item"
          :class="{ 'workspace-navigation__item--active': item.active }"
          :title="item.label"
          :aria-current="item.active ? 'page' : undefined"
          @click="item.onClick"
        >
          <component :is="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
      <div
        v-if="config.initialPath"
        class="installation-path"
        :title="config.initialPath"
      >
        <span class="installation-path__status" />
        <strong>{{ texts.installationDetected }}</strong>
        <span>{{ config.initialPath }}</span>
      </div>
    </section>
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
import GameBrief from '@renderer/components/game-brief.vue'
import { AppstoreAddOutlined, CarOutlined, CloudDownloadOutlined, ContainerOutlined, DashboardOutlined, DatabaseOutlined, EditOutlined, FileOutlined, FolderOpenOutlined, GithubOutlined, InfoCircleOutlined, LinkOutlined, LogoutOutlined, QuestionCircleOutlined, RollbackOutlined, SaveOutlined, SettingOutlined, SyncOutlined, ThunderboltOutlined } from '@ant-design/icons-vue'
import { Page } from '@modules/windows/enums'
import { Category, SourceType } from '@renderer/pages/general/enums'
import { useListStore } from '@renderer/pages/general/store/list'
import { usePageStore } from '@renderer/pages/general/store/page'
import { di } from '@utilities/di/container'
import { APP_TOKEN, ARCHIVER_TOKEN, BACKUP_TOKEN, CONFIG_TOKEN, FILES_TOKEN, MESSAGES_TOKEN, MODS_TOKEN, PATHS_TOKEN, SYSTEM_TOKEN } from '@utilities/di/renderer/tokens'
import type { ItemType, MenuProps } from 'ant-design-vue'
import { Button, Menu, Tooltip } from 'ant-design-vue'
import { computed, h, nextTick, onMounted, ref } from 'vue'
import { Settings } from '../settings'
import { WhatsNew } from '../whats-new'
import { Language } from '../language'
import { MENU_LOCALIZATION as texts } from './localization'

const config = di.resolve(CONFIG_TOKEN)
const system = di.resolve(SYSTEM_TOKEN)
const paths = di.resolve(PATHS_TOKEN)
const app = di.resolve(APP_TOKEN)
const backup = di.resolve(BACKUP_TOKEN)
const archiver = di.resolve(ARCHIVER_TOKEN)
const appIconUrl = new URL('../../../images/app-icon.svg', import.meta.url).href

const settingsHasBeenOpened = ref(false)
const settingsIsOpen = ref(false)

const whatsNewHasBeenOpened = ref(false)
const whatsNewIsOpen = ref(false)

/** Отсутствует `initial.pak`. */
const initialNotFound = !config.initialPath
const pageStore = usePageStore()
const { route } = pageStore
const listStore = useListStore()
const { setCategory, setSource } = listStore

/** Ссылки на медиа ресурсы. */
const links = {
  profile: 'https://github.com/OscarD0823',
	/** github.com. */
	github: 'https://github.com/OscarD0823/snowrunner',
	releases: 'https://github.com/OscarD0823/snowrunner/releases'
}

const workspaceItems = computed(() => [
	{
		key: 'trucks',
		label: texts.trucksNav,
		icon: CarOutlined,
		active: listStore.category === Category.trucks && listStore.source !== SourceType.edited && listStore.source !== SourceType.mods,
		onClick: () => openLibrary(Category.trucks, SourceType.all)
	},
	{
		key: 'trailers',
		label: texts.trailersNav,
		icon: ContainerOutlined,
		active: listStore.category === Category.trailers && listStore.source !== SourceType.edited && listStore.source !== SourceType.mods,
		onClick: () => openLibrary(Category.trailers, SourceType.all)
	},
	{
		key: 'engines',
		label: texts.enginesNav,
		icon: ThunderboltOutlined,
		active: listStore.category === Category.engines && listStore.source !== SourceType.edited && listStore.source !== SourceType.mods,
		onClick: () => openLibrary(Category.engines, SourceType.all)
	},
	{
		key: 'wheels',
		label: texts.wheelsNav,
		icon: DashboardOutlined,
		active: listStore.category === Category.wheels && listStore.source !== SourceType.edited && listStore.source !== SourceType.mods,
		onClick: () => openLibrary(Category.wheels, SourceType.all)
	},
	{
		key: 'winches',
		label: texts.winchesNav,
		icon: LinkOutlined,
		active: listStore.category === Category.winches && listStore.source !== SourceType.edited && listStore.source !== SourceType.mods,
		onClick: () => openLibrary(Category.winches, SourceType.all)
	},
	{
		key: 'edited',
		label: texts.editedNav,
		icon: EditOutlined,
		active: listStore.source === SourceType.edited,
		onClick: () => openLibrary(listStore.category, SourceType.edited)
	},
	{
		key: 'mods',
		label: texts.modsNav,
		icon: AppstoreAddOutlined,
		active: listStore.source === SourceType.mods,
		onClick: () => openLibrary(listStore.category, SourceType.mods)
	}
])

/** Элементы меню. */
const items = computed(() => [
	// Файл.
	{
		key: 'file_menu',
		label: texts.fileMenuLabel,
		icon: h(FileOutlined),
		children: [
			...inAdvancedMode([
				{
					key: 'open_files_folder',
					label: texts.openFilesFolderItemLabel,
					icon: h(FolderOpenOutlined),
					disabled: initialNotFound,
					onClick: () => system.openPath(paths.mainTemp)
				},
				{
					key: 'save_files',
					label: texts.saveFilesItemLabel,
					icon: h(SaveOutlined),
					disabled: initialNotFound,
					onClick: () => updateFiles()
				},
				{
					key: 'unpack_files',
					label: texts.unpackFilesItemLabel,
					icon: h(SyncOutlined),
					disabled: initialNotFound,
					onClick: () => unpackFiles()
				},
				{ type: 'divider' }
			]),
			{
				key: 'exit',
				label: texts.exitMenuItemLabel,
				icon: h(LogoutOutlined),
				onClick: () => app.quit()
			}
		]
	},

	// Бэкап.
	{
		key: 'backup_menu',
		label: texts.backupMenuLabel,
		icon: h(DatabaseOutlined),
		disabled: initialNotFound,
		children: [
			{
				key: 'open_backup',
				label: texts.openButton,
				icon: h(FolderOpenOutlined),
				onClick: () => system.openPath(paths.backupFolder)
			},
			{ type: 'divider' },
			{
				key: 'save_backup',
				label: texts.saveButton,
				icon: h(SaveOutlined),
				onClick: () => backup.save()
			},
			{
				key: 'recover_from_backup',
				label: texts.restoreMenuItemLabel,
				icon: h(RollbackOutlined),
				onClick: () => backup.recoverFromIt()
			}
		]
	},

	// Настройки.
	{
		key: 'settings_menu',
		label: texts.settingsMenuLabel,
		icon: h(SettingOutlined),
		children: [
			{
				key: 'open_settings',
				label: texts.settingsMenuLabel,
				icon: h(SettingOutlined),
				disabled: initialNotFound,
				onClick: () => openSettings()
			},
			{ type: 'divider' },
			{
				key: 'reset_settings',
				label: texts.resetMenuItemLabel,
				icon: h(RollbackOutlined),
				disabled: initialNotFound,
				onClick: () => app.reset()
			},
			{
				key: 'uninstall_program',
				label: texts.uninstallMenuItemLabel,
				icon: h(LogoutOutlined),
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
		icon: h(QuestionCircleOutlined),
		children: [
			{
				key: 'version_info',
				label: texts.versionMenuItemLabel,
				icon: h(InfoCircleOutlined),
				onClick: () => openWhatsNew()
			},
			{
				key: 'releases',
				label: texts.releasesTitle,
				icon: h(CloudDownloadOutlined),
				onClick: () => system.openLink(links.releases)
			},
			{ type: 'divider' },
			{
				key: 'github',
				label: texts.githubTitle,
				icon: h(GithubOutlined),
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

function openLibrary(category: Category, source: SourceType) {
	setCategory(category)
	setSource(source)
	route(Page.lists)
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
	flex: 0 0 auto;
	flex-direction: column;
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
	z-index: 10;
}

.topbar {
	display: flex;
	align-items: center;
	min-height: 60px;
	padding: 0 16px;
	background: #0b1220;
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);

	&__actions {
		display: flex;
		align-items: center;
		gap: 7px;
		min-width: 0;
		margin-left: auto;
	}
}

.brand {
	display: flex;
	align-items: center;
	gap: 11px;
	min-width: 248px;
	color: white;
	user-select: none;
}

.brand-mark {
	width: 42px;
	height: 42px;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 8px 22px rgba(234, 88, 12, 0.22);

	img {
		display: block;
		width: 100%;
		height: 100%;
	}
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

.workspace-navigation {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 5px;
	background: #edf2f6;
	border: 1px solid #e1e7ed;
	border-radius: 12px;

	&__item {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		height: 38px;
		padding: 0 12px;
		color: #536274;
		background: transparent;
		border: 0;
		border-radius: 8px;
		font: inherit;
		font-size: 12px;
		font-weight: 650;
		cursor: pointer;
		transition: color 0.16s ease, background-color 0.16s ease, box-shadow 0.16s ease;

		&:hover,
		&:focus-visible {
			color: #172033;
			background: white;
			outline: none;
		}

		&--active {
			color: white;
			background: linear-gradient(145deg, #f97316, #ea580c);
			box-shadow: 0 5px 14px rgba(234, 88, 12, 0.24);
		}

		:deep(.anticon) {
			font-size: 16px;
		}
	}
}

.project-links { display:flex;align-items:center;gap:9px;margin-top:2px;white-space:nowrap;user-select:text; }
.project-links a { display:inline-flex;align-items:center;gap:4px;min-height:24px;font-size:11px;text-decoration:none;color:#b5c8dd;border-radius:4px; }
.project-links a:hover { color:#ffb46e;text-decoration:underline; }
.project-links a:focus-visible { outline:2px solid #ffb46e;outline-offset:2px;color:#fff; }
.project-links :deep(.anticon) { font-size:13px; }

.workspace-bar {
	display: flex;
	align-items: center;
	gap: 14px;
	min-height: 56px;
	padding: 8px 16px;
	background: rgba(255, 255, 255, 0.97);
	border-bottom: 1px solid var(--sr-border);
}

.installation-path {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	max-width: 520px;
	height: 38px;
	margin-left: auto;
	padding: 0 11px;
	color: #64748b;
	background: #f4f7f9;
	border: 1px solid #e1e7ed;
	border-radius: 9px;
	font-size: 11px;
	white-space: nowrap;
	overflow: hidden;

	strong {
		flex: 0 0 auto;
		color: #334155;
	}

	span:last-child {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&__status {
		width: 7px;
		height: 7px;
		flex: 0 0 auto;
		background: #34d399;
		border-radius: 50%;
		box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.12);
	}
}

.topbar-button {
	display: grid;
	width: 38px;
	height: 38px;
	padding: 0;
	place-items: center;
	color: #cbd5e1;
	background: rgba(255, 255, 255, 0.07);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 9px;
	font-size: 17px;

	&:hover,
	&:focus-visible {
		color: white !important;
		background: rgba(255, 255, 255, 0.14) !important;
	}
}

.menu {
	flex: 0 1 auto;
	min-width: 270px;
	justify-content: flex-end;
	background: transparent;
	color: #cbd5e1;
	line-height: 60px;

	:deep(.ant-menu-submenu),
	:deep(.ant-menu-item) {
		padding: 0 13px !important;
		color: #cbd5e1 !important;

		.ant-menu-title-content,
		.anticon {
			color: inherit !important;
			opacity: 1 !important;
			visibility: visible !important;
		}

		&:hover,
		&.ant-menu-submenu-active,
		&.ant-menu-submenu-open {
			color: white;
		}

		&:hover::after,
		&.ant-menu-submenu-active::after,
		&.ant-menu-submenu-open::after {
			border-bottom: 2px solid #f97316 !important;
		}

			.ant-menu-submenu-title {
				height: 60px;
			display: flex !important;
			justify-content: center;
			align-items: center;
		}
	}
}

@media (max-width: 1180px) {
	.brand {
		min-width: auto;
	}

	.brand-copy > strong {
		display: none;
	}

  .project-links { margin:0;gap:7px; }

	.workspace-navigation__item {
		padding: 0 10px;
	}

	.installation-path strong {
		display: none;
	}
}

@media (max-width: 920px) {
	.menu {
		flex: 0 1 auto;
		min-width: 40px;

		:deep(.ant-menu-title-content) {
			display: none;
		}
	}

	.workspace-navigation__item {
		width: 38px;
		padding: 0;
		justify-content: center;

		span {
			display: none;
		}
	}
}

@media (max-width: 680px) {
	.topbar {
		min-height: 54px;
		padding: 0 8px;
		gap: 7px;
	}

	.brand-mark {
		width: 36px;
		height: 36px;
	}

	.workspace-navigation {
		gap: 2px;
		padding: 3px;
	}

	.workspace-bar {
		min-height: 48px;
		padding: 5px 8px;
	}

	.installation-path {
		height: 34px;

		span:last-child {
			display: none;
		}
	}

	.workspace-navigation__item {
		width: 34px;
		height: 34px;
	}

	.menu {
		line-height: 54px;

		:deep(.ant-menu-submenu),
		:deep(.ant-menu-item) {
			padding: 0 8px !important;

			.ant-menu-submenu-title {
				height: 54px;
			}
		}
	}
}
</style>
