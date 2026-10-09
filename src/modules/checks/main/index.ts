import { loadLocalization } from '@localization/main'
import type { IMainDialogs } from '@modules/dialogs/types'
import { ProgramError } from '@modules/errors/main'
import type { IDirs, IFiles } from '@modules/files/main'
import { di, inject } from '@utilities/di/container'
import { ARCHIVER_TOKEN, BACKUP_TOKEN, DIALOGS_TOKEN, DIRS_TOKEN, FILES_TOKEN, SIZES_TOKEN } from '@utilities/di/main/tokens'
import { app } from 'electron'
import { CHECKS_LOCALIZATION } from '../localization'
import type { IMainChecks } from '../types'

/** Разного рода проверки. [main] */
export class Checks implements IMainChecks {
	/** Локализация. */
	private readonly texts = loadLocalization(CHECKS_LOCALIZATION)

	@inject(DIALOGS_TOKEN)
	/** Диалоги. */
	private readonly dialogs!: IMainDialogs

	/** Основные папки. */
	@inject(DIRS_TOKEN)
	private readonly dirs!: IDirs

	/** Основны файлы. */
	@inject(FILES_TOKEN)
	private readonly files!: IFiles

	/** Папка с xml файлами из initial.pak. */
	private readonly MEDIA_FOLDER = '[media]'

	async hasAdminPrivileges(): Promise<boolean> {
		try {
			await this.files.config.make()

			const readResult = await this.files.config.canRead()
			const writeResult = await this.files.config.canWrite()

			if (!readResult.result || !writeResult.result) {
				throw new Error('Cannot read/write json file', { cause: readResult.error ?? writeResult.error })
			}

			return true
		} catch (error: any) {
			void this.dialogs.alert({
				message: `${this.texts.adminRequiredMessage}\nError: ${error?.message}`,
				type: 'warning',
				buttons: ['Exit'],
				title: 'Error'
			}).then(app.quit)

			return false
		}
	}

	async checkInitialChanges() {
		const sizes = di.resolve(SIZES_TOKEN)
		const initial = this.files.initial

		const hasInitial = await initial.exists()
		if (!hasInitial) {
			return
		}

		const hasContent = (await Promise.all([
			this.dirs.mainTemp.dir(this.MEDIA_FOLDER).exists(),
			this.dirs.classes.exists(),
			this.dirs.dlc.exists(),
			this.dirs.templates.exists()
		])).every(Boolean)
		const withoutChanges = await initial.getSize() === sizes.initial

		if (hasContent && withoutChanges) {
			return
		}

		if (!await this.files.backupInitial.exists()) {
			const backup = di.resolve(BACKUP_TOKEN)

			await backup.save()
		}

		if (await this.dirs.mainTemp.exists()) {
			await this.dirs.backupInitialData.remove()
			await this.dirs.backupInitialData.root.make()

			if (!RENDERER_VITE_DEV_SERVER_URL) {
				await this.dirs.mainTemp.move(this.dirs.backupInitialData)
			}
		}

		const archiver = di.resolve(ARCHIVER_TOKEN)

		await archiver.unpackMain(false)
	}

	/**
	 * Проверить наличие всех путей для работы программы. `config.paths`.
	 * В случае неудачи выводит уведомление.
	 */
	async hasAllPaths(): Promise<boolean> {
		if (!await this.files.initial.exists()) {
			void this.dialogs.error(this.texts.initialNotFound)

			return false
		}

		if (!await this.dirs.classes.exists()) {
			void this.dialogs.error(this.texts.classesNotFound)

			return false
		}

		if (!await this.dirs.dlc.exists()) {
			void this.dialogs.error(this.texts.dlcFolderNotFound)

			return false
		}

		return true
	}
}
