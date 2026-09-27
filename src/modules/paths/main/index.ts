import { app } from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { IMainPathsManager, IPaths } from '../types'

export type * from '../types'

/** Менеджер путей. [main] */
export class Paths implements IMainPathsManager {
	/** URL репозитория. */
	private readonly REPOS_URL = 'https://github.com/OscarD0823/snowrunner'

	/** URL github pages репозитория. */
	private readonly IO_REPOS_URL = 'https://oscard0823.github.io/snowrunner'

	/** Папка, в которой находится текущий исполняемый скрипт. */
	private readonly dirname = dirname(fileURLToPath(import.meta.url))

	/** Almacenamiento que no se elimina al recompilar la aplicación. */
	private readonly dataRoot = process.env.NODE_ENV === 'development'
		? this.resolve('../../.snowrunner-data')
		: app.getPath('userData')

	accessor object: IPaths = Object.freeze({
		publicInfo: `${this.IO_REPOS_URL}/version-info.json`,
		downloadPage: `${this.IO_REPOS_URL}/download.html`,
		update: `${this.REPOS_URL}/releases/download`,
		root: this.dataRoot,
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
		backupInitialData: this.data('backups/previous_initial'),
		icon: this.resolve('../favicon.ico'),
		winrar: this.resolve('winrar'),
		mainTemp: this.data('mainTemp'),
		modsTemp: this.data('modsTemp'),
		updateTemp: this.data('updateTemp'),
		strings: this.data('mainTemp/[strings]'),
		uninstall: this.resolve('../../../../unins000.exe'),
		classes: this.data('mainTemp/[media]/classes'),
		templates: this.data('mainTemp/[media]/_templates'),
		dlc: this.data('mainTemp/[media]/_dlc')
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
