import { makeReactive } from '@bridge/main'
import type { IEnv } from '@modules/env/types'
import type { IDirs } from '@modules/files/main'
import type { IMainSystem } from '@modules/system/types'
import { isNullable } from '@utilities/checks/main'
import { di, inject } from '@utilities/di/container'
import { APP_CONSTANTS_TOKEN, DIRS_TOKEN, ENV_TOKEN, SYSTEM_TOKEN } from '@utilities/di/main/tokens'
import { BuildType, Lang, strToLang } from '../enums'
import type { IConfig, IMainConfigManager } from '../types'
import { ConfigRepository } from './repository'

/** Работа с конфигурацией программы. [main] */
export class Config implements IMainConfigManager {
	/** Переменные среды. */
	@inject(ENV_TOKEN)
	private readonly env!: IEnv

	/** Основные папки. */
	@inject(DIRS_TOKEN)
	private readonly dirs!: IDirs

	/** Система. */
	@inject(SYSTEM_TOKEN)
	private readonly system!: IMainSystem

	/** Репозиторий. */
	private readonly repository = new ConfigRepository()

	/** Стандартное значение конфигурации для `prod`. */
	private readonly prodDefault: IConfig = {
		version: di.resolve(APP_CONSTANTS_TOKEN).VERSION,
		buildType: this.env.isDev
			? BuildType.dev
			: BuildType.prod,
		lang: Lang.es,
		initialPath: null,
		advancedMode: false,
		useMods: true,
		openWhatsNew: true,
		checkUpdates: true,
		optimizeUnpack: false
	}

	/** Стандартное значение конфигурации в `dev` режиме. */
	private readonly devDefault: IConfig = {
		...this.prodDefault,
		advancedMode: true,
		lang: strToLang(this.env.lang) || this.prodDefault.lang,
		initialPath: this.env.initialPath || this.prodDefault.initialPath,
		optimizeUnpack: false,
		openWhatsNew: false
	}

	/** Стандартное значение конфигурации. */
	readonly default: IConfig = this.prodDefault.buildType === BuildType.dev
		? this.devDefault
		: this.prodDefault

	/** Программа в режиме разработки. */
	get isDev() {
		return this.object.buildType === BuildType.dev
	}

	/** Объект конфигурации. */
	accessor object!: IConfig

	constructor() {
		makeReactive(this, 'Config', 'object')
		this.object = this.getConfig()
	}

	/** Сохранить изменения в `config.json`. */
	async save() {
		await this.repository.save(this.object)
	}

	/** Получить конфигурацию. */
	get(): IConfig {
		return new Proxy({} as IConfig, {
			get: (_target, p) => this.object[p],
			set: (_target, p, newValue) => {
				this.set({ [p]: newValue })
				return true
			}
		})
	}

	/** Установить конфигурацию. */
	set(newObject: Partial<IConfig>) {
		for (const key in newObject) {
			this.object[key] = newObject[key]
		}
	}

	async reset() {
		this.set(this.default)
	}

	/**
	 * Получить конфигурацию.
	 * @returns Объект конфигурации.
	 */
	private getConfig(): IConfig {
		try {
			return this.getFromJSON()
		} catch {
			return this.default
		}
	}

	/**
	 * Получить конфигурацию из JSON.
	 * @returns Объект конфигурации.
	 */
	private getFromJSON(): IConfig {
		let config = this.repository.readSync()

		if (!config) {
			return this.default
		}

		if (config.version === this.default.version) {
			config = { ...this.default, ...config }
		} else if (this.isOlderVersion(config.version, this.default.version)) {
			config = this.convertToNewest(config)
			this.dirs.mainTemp.removeSync()
		} else {
			config = this.default
		}

		config.version = this.default.version


		config.lang = isNullable(config.lang)
			? this.default.lang
			: strToLang(String(config.lang)) ?? this.default.lang

		return config
	}

	/**
	 * Привести старую версию конфигурации к текущей.
	 * @param data Старая версия конфигурации.
	 * @returns Адаптированная конфигурация.
	 */
	private convertToNewest(data: IConfig): IConfig {
		return {
			...this.default,
			...data,
			version: this.default.version,
			initialPath: data.initialPath ?? null,
			// Las versiones anteriores no disponían de un actualizador funcional.
			// Lo activamos una sola vez durante la migración; después la elección
			// del usuario se conserva normalmente en la misma versión.
			checkUpdates: true
		}
	}

	private isOlderVersion(current: string, target: string) {
		const currentParts = current.split('.').map(part => Number.parseInt(part, 10) || 0)
		const targetParts = target.split('.').map(part => Number.parseInt(part, 10) || 0)
		const length = Math.max(currentParts.length, targetParts.length)

		for (let index = 0; index < length; index++) {
			const difference = (currentParts[index] ?? 0) - (targetParts[index] ?? 0)

			if (difference !== 0) {
				return difference < 0
			}
		}

		return false
	}
}
