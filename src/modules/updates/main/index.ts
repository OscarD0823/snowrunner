import { loadLocalization } from '@localization/main'
import { ProgramError } from '@modules/errors/main'
import type { IMainLoading } from '@modules/loading/types'
import { di, inject } from '@utilities/di/container'
import { APP_TOKEN, DIRS_TOKEN, LOADING_TOKEN, PATHS_TOKEN } from '@utilities/di/main/tokens'
import { app, shell } from 'electron'
import { open } from 'node:fs/promises'
import { get } from 'node:https'
import { UPDATES_LOCALIZATION } from '../localization'
import type { IMainUpdates } from '../types'

/** Работа с обновлениями программы. [main] */
export class Updates implements IMainUpdates {
	/** Локализация. */
	private readonly texts = loadLocalization(UPDATES_LOCALIZATION)

	/** Работа с загрузкой.. */
	@inject(LOADING_TOKEN)
	private readonly loading!: IMainLoading

	download(url: string, path: string): Promise<string | void> {
		const { promise, resolve, reject } = Promise.withResolvers<string | void>()

		get(url, async response => {
			const location = response.headers.location

			if (!location) {
				return reject(`The file on GitHub is not available for download. URL: '${url}'`)
			}

			get(location, async response => {
				const file = await open(path, 'w')
				const writeStream = file.createWriteStream()
				const length = Number.parseInt(response.headers['content-length']!, 10)
				let current = 0

				this.loading.setStagesCount(100)
				response.pipe(writeStream)
				response.on('data', chunk => {
					current += chunk.length
					this.loading.setCompletedCount(Math.floor(100 * (current / length)))
				})
				response.on('error', reject)
				response.on('end', () => {
					this.loading.completeStage()
					writeStream.close(() => resolve())
				})
			})
		})

		return promise
	}

	async updateApp(version: string) {
		this.loading.init(this.texts.downloading)

		try {
			const app = di.resolve(APP_TOKEN)
			const dirs = di.resolve(DIRS_TOKEN)
			const paths = di.resolve(PATHS_TOKEN)

			await app.clearTemp()
			await dirs.updateTemp.make()

			// softprops/action-gh-release normaliza los espacios del nombre real
			// del archivo a puntos, aunque conserve la etiqueta legible.
			const setupName = 'SnowRunner.Studio.Setup.exe'
			const url = `${paths.update}/v${version}/${encodeURIComponent(setupName)}`
			const file = dirs.updateTemp.file(setupName)

			await this.download(url, file.path)

			if (await shell.openPath(file.path)) {
				shell.showItemInFolder(file.path)
			}

			app.quit()
		} catch (error: any) {
			setTimeout(() => {
				app.relaunch()
				app.quit()
			}, 2000)

			throw new ProgramError(error)
		}
	}
}
