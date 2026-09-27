import { readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const _dirname = dirname(fileURLToPath(import.meta.url))
const version = JSON.parse(String(readFileSync(join(_dirname, '../../package.json')))).version

/** Конфигурация Electron Forge. */
class ForgeConfig {
	/** Конфигурация `main` процесса. */
	mainConfigPath = this.getPathToConfig('main')

	/** Конфигурация для `preload` процесса. */
	preloadConfigPath = this.getPathToConfig('preload')

	/** Конфигурация для `renderer` процесса. */
	rendererConfigPath = this.getPathToConfig('renderer')

	/** Получить объект конфигурации. */
	/**
	 * @returns {import("@electron-forge/shared-types").ForgeConfig}
	 */
	getConfig() {
		return {
			packagerConfig: {
				overwrite: true,
				executableName: 'SnowRunner Studio',
				icon: '.vite/favicon.ico',
				appBundleId: 'com.oscard0823.snowrunnerstudio'
			},
			makers: [
				{
					name: '@electron-forge/maker-squirrel',
					config: {
						name: 'SnowRunnerStudio',
						authors: 'OscarD0823',
						description: 'Editor visual multilingüe para SnowRunner',
						exe: 'SnowRunner Studio.exe',
						setupExe: 'SnowRunner Studio Setup.exe',
						setupIcon: join(_dirname, '../images/favicon.ico'),
						iconUrl: 'https://raw.githubusercontent.com/OscarD0823/snowrunner/main/src/images/favicon.ico',
						shortcutName: 'SnowRunner Studio',
						noMsi: true
					}
				}
			],
			publishers: [
				{
					name: '@electron-forge/publisher-github',
					config: {
						repository: {
							owner: 'OscarD0823',
							name: 'snowrunner'
						},
						draft: false,
						prerelease: false
					}
				}
			],
			hooks: {
				async prePackage() {
					console.info('Change version')

					const path = join(_dirname, '../modules/app/constants.ts')
					const constsData = String(await readFile(path))

					await writeFile(path, constsData.replace(/APP_VERSION =.*?(\r?\n)/, `APP_VERSION = '${version}'$1`))
				}
			},
			plugins: [
				{
					name: '@electron-forge/plugin-vite',
					config: {
						build: [
							{
								entry: join(_dirname, '../main/index.ts'),
								config: this.mainConfigPath
							},
							{
								entry: join(_dirname, '../renderer/preload.ts'),
								config: this.preloadConfigPath
							}
						],
						renderer: [
							{
								name: 'renderer',
								config: this.rendererConfigPath
							}
						]
					}
				}
			]
		}
	}

	/**
	 * @param {string} name Название файла конфигурации.
	 * @returns {string} Путь до файла конфигурации.
	 */
	getPathToConfig(name) {
		return `src/build-configs/vite.${name}.config.ts`
	}
}

export default new ForgeConfig().getConfig()
