import { readFileSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const _dirname = dirname(fileURLToPath(import.meta.url))
const version = JSON.parse(String(readFileSync(join(_dirname, '../../package.json')))).version
const isStoreBuild = process.env.SNOWRUNNER_STORE_BUILD === 'true'
const isStoreUpload = process.env.SNOWRUNNER_STORE_UPLOAD === 'true'

if (isStoreUpload && (!process.env.MSIX_IDENTITY_NAME || !process.env.MSIX_PUBLISHER)) {
	throw new Error('Para la entrega final define MSIX_IDENTITY_NAME y MSIX_PUBLISHER con los valores exactos de Partner Center.')
}

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
			outDir: process.env.SNOWRUNNER_BUILD_OUT || 'out',
			packagerConfig: {
				overwrite: true,
				executableName: 'SnowRunner Studio',
				icon: '.vite/favicon.ico',
				appBundleId: 'com.oscard0823.snowrunnerstudio',
				// El plugin de Vite solo necesita copiar su salida compilada.
				// Así no entran fuentes, datos temporales ni builds anteriores.
				ignore: file => Boolean(file) && !file.startsWith('/.vite')
			},
			makers: isStoreBuild ? [
				{
					name: '@electron-forge/maker-msix',
					config: {
						packageAssets: join(_dirname, '../store-assets'),
						windowsKitPath: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64',
						sign: !isStoreUpload,
						logLevel: 'warn',
						manifestVariables: {
							packageIdentity: process.env.MSIX_IDENTITY_NAME || 'OscarD0823.OffroadXMLStudio.Dev',
							publisher: process.env.MSIX_PUBLISHER || 'CN=OscarD0823 Development',
							publisherDisplayName: process.env.MSIX_PUBLISHER_DISPLAY_NAME || 'OscarD0823',
							packageDisplayName: 'Offroad XML Studio',
							appDisplayName: 'Offroad XML Studio',
							packageDescription: 'Editor local no oficial compatible con SnowRunner. No incluye archivos ni imágenes del juego.',
							packageBackgroundColor: '#0f172a',
							packageMinOSVersion: '10.0.19041.0',
							packageMaxOSVersionTested: '10.0.26100.0'
						}
					}
				}
			] : [
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
					await rm(join(_dirname, '../../.vite/renderer/src/renderer/pages/images'), { recursive: true, force: true })

					const path = join(_dirname, '../modules/app/constants.ts')
					const constsData = String(await readFile(path))

					const versionPattern = /(readonly VERSION = )(['"]).*?\2/
					if (!versionPattern.test(constsData)) {
						throw new Error('No se pudo sincronizar VERSION con package.json.')
					}
					const updatedConsts = constsData.replace(versionPattern, `$1'${version}'`)

					await writeFile(path, updatedConsts)
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
