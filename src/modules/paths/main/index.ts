import { app } from 'electron'
import { accessSync, constants, existsSync, readFileSync, statfsSync } from 'node:fs'
import { dirname, join, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { IMainPathsManager, IPaths } from '../types'

export type * from '../types'

/** Менеджер путей. [main] */
export class Paths implements IMainPathsManager {
	/** URL репозитория. */
	private readonly REPOS_URL = 'https://github.com/OscarD0823/snowrunner'

	/** Папка, в которой находится текущий исполняемый скрипт. */
	private readonly dirname = dirname(fileURLToPath(import.meta.url))

	/** Almacenamiento que no se elimina al recompilar la aplicación. */
	private readonly dataRoot = process.env.SNOWRUNNER_DATA_ROOT
		? resolvePath(process.env.SNOWRUNNER_DATA_ROOT)
		: process.env.NODE_ENV === 'development'
			? this.resolve('../../.snowrunner-data')
			: app.getPath('userData')
	/** Los XML extraídos pueden ocupar cientos de MB; se guardan junto al juego cuando es posible. */
	private readonly workspaceRoot = this.getWorkspaceRoot()

	accessor object: IPaths = Object.freeze({
		publicInfo: 'https://api.github.com/repos/OscarD0823/snowrunner/releases/latest',
		downloadPage: `${this.REPOS_URL}/releases/latest`,
		update: `${this.REPOS_URL}/releases/download`,
		root: this.dataRoot,
		workspace: this.workspaceRoot,
		pages: this.resolve('../renderer/src/renderer/pages'),
		config: this.json('config'),
		edited: this.json('edited'),
		favorites: this.json('favorites'),
		mods: this.json('mods'),
		sizes: this.json('sizes'),
		texts: this.json('game-texts'),
		exported: this.json('exported'),
		backupFolder: this.data('backups'),
		backupInitial: this.data('backups/initial.pak'),
		backupInitialWithDate: this.getBackupInitialWithDate(),
		backupInitialData: this.workspace('backups/previous_initial'),
		icon: this.resolve('../favicon.ico'),
		mainTemp: this.workspace('mainTemp'),
		modsTemp: this.workspace('modsTemp'),
		updateTemp: this.workspace('updateTemp'),
		strings: this.workspace('mainTemp/[strings]'),
		uninstall: this.resolve('../../../../unins000.exe'),
		classes: this.workspace('mainTemp/[media]/classes'),
		templates: this.workspace('mainTemp/[media]/_templates'),
		dlc: this.workspace('mainTemp/[media]/_dlc')
	})

	get() {
		return this.object
	}

	/**
	 * Обработать путь относительно текущей папки.
	 * @param paths Пути.
	 * @returns Абсолютный путь.
	 */
	private resolve(...paths: string[]) {
		return join(this.dirname, ...paths)
	}

	/**
	 * Получить путь до json файла.
	 * @param name Название файла.
	 * @returns Путь до json файла.
	 */
	private json(name: string): string {
		return this.data(`jsons/${name}.json`)
	}

	/** Obtener una ruta dentro del almacenamiento persistente. */
	private data(...paths: string[]) {
		return join(this.dataRoot, ...paths)
	}

	private workspace(...paths: string[]) {
		return join(this.workspaceRoot, ...paths)
	}

	private getWorkspaceRoot() {
		if (process.env.NODE_ENV === 'development') {
			return this.dataRoot
		}

		const configured = process.env.SNOWRUNNER_WORKSPACE_PATH
		if (configured) return configured

		try {
			const configPath = join(this.dataRoot, 'jsons', 'config.json')
			if (!existsSync(configPath)) return this.dataRoot

			const config = JSON.parse(readFileSync(configPath, 'utf8')) as { initialPath?: string }
			if (!config.initialPath) return this.dataRoot

			const normalized = config.initialPath.replaceAll('/', '\\')
			const marker = '\\preload\\paks\\client\\initial.pak'
			const markerIndex = normalized.toLowerCase().lastIndexOf(marker)
			const gameRoot = markerIndex >= 0
				? normalized.slice(0, markerIndex)
				: dirname(normalized)

			accessSync(gameRoot, constants.W_OK)
			const disk = statfsSync(gameRoot)
			const freeBytes = disk.bavail * disk.bsize

			return freeBytes >= 1024 ** 3
				? join(gameRoot, '.snowrunner-studio')
				: this.dataRoot
		} catch {
			return this.dataRoot
		}
	}

	/**
	 * Получить дату-время для initial.pak.
	 * @returns Дата-время.
	 */
	private getInitialDateTime() {
		const date = new Date()
		const dateString = date.toISOString().split('T')[0]
		const timeString = date.toLocaleTimeString().replaceAll(':', '-')

		return `${dateString}_${timeString}`
	}

	/**
	 * Получить путь к бэкапу с датой-временем.
	 * @returns Путь к бэкапу с датой-временем.
	 */
	private getBackupInitialWithDate() {
		return this.data(`backups/initial_${this.getInitialDateTime()}.pak`)
	}
}
