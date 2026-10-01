import type { IMainArchiver } from '@modules/archiver/types'
import type { IDir, IDirs, IFile, IFiles } from '@modules/files/types'
import { makeReactive } from '@utilities/bridge/main'
import { hasItems } from '@utilities/checks/main'
import { di, inject } from '@utilities/di/container'
import { ARCHIVER_TOKEN, CONFIG_TOKEN, DIRS_TOKEN, ENV_TOKEN, FILES_TOKEN, GAME_TEXTS_TOKEN, SIZES_TOKEN } from '@utilities/di/main/tokens'
import { BaseMainArray } from '@utilities/json-arrays/main'
import { processNameForFilesystem } from '@utilities/strings/main'
import { app } from 'electron'
import { homedir, userInfo } from 'node:os'
import type { IMainMods, IMod } from '../types'

/** Работа с массивом модификаций. [main] */
export class Mods extends BaseMainArray<IMod, IMod & { file: IFile }> implements IMainMods {
	/** Архиватор. */
	@inject(ARCHIVER_TOKEN)
	private readonly archiver!: IMainArchiver

	/** Основные файлы. */
	@inject(FILES_TOKEN)
	private readonly files!: IFiles

	/** Основные папки. */
	@inject(DIRS_TOKEN)
	private readonly dirs!: IDirs

	protected override jsonFile = this.files.mods

	constructor() {
		super()
		makeReactive(this, 'Mods', 'arr')
		this.init()
	}

	override convert(item: IMod): IMod & { file: IFile } {
		return { ...item, file: this.files.newFile(item.path) }
	}

	async procMods() {
		const config = di.resolve(CONFIG_TOKEN)

		if (!config.useMods) {
			return
		}

		// Incorpora automáticamente los mods instalados desde la última ejecución.
		for (const [file, name] of await this.getAllMods()) {
			if (!this.some(mod => mod.path.toLowerCase() === file.path.toLowerCase())) {
				this.push({ fileName: file.basename(), path: file.path, name })
			}
		}

		if (!hasItems(this)) {
			return
		}

		const sizes = di.resolve(SIZES_TOKEN)
		const deleteFromList = (name: string) => {
			this.findAndRemove(mod => mod.name === name)
		}

		for (const { file, name } of this.converted) {
			if (!await file.exists() || !await file.hasPermissions()) {
				deleteFromList(name)

				continue
			}

			const sizeChanged = await file.getSize() !== sizes.getModSize(file)
			const hasDir = await this.dirs.modsTemp.dir(name).exists()

			if (!sizeChanged && hasDir) {
				continue
			}

			try {
				await this.archiver.unpackMod(file, name)
			} catch (error) {
				// Un mod descargado a medias o con un contenedor distinto no debe
				// impedir que la biblioteca principal se abra.
				console.warn(`Se omitió el mod no compatible: ${file.path}`, error)
				await this.dirs.modsTemp.dir(name).remove()
				deleteFromList(name)
				continue
			}
			const hasClasses = await this.dirs.modsTemp.dir(name, 'classes').exists()

			if (!hasClasses) {
				deleteFromList(name)

				continue
			}
		}

		const gameTexts = di.resolve(GAME_TEXTS_TOKEN)

		await gameTexts.initFromMods()
	}

	async findMods(dir: IDir): Promise<[IFile, name: string][]> {
		const out: [IFile, string][] = []

		if (!await dir.exists()) {
			return []
		}

		const processFile = async(file: IFile, dir: IDir) => {
			if (out.some(([outFile]) => outFile.path === file.path)) {
				return
			}

			const known = this.find(mod => mod.path.toLowerCase() === file.path.toLowerCase())

			if (known) {
				out.push([file, known.name])

				return
			}

			const tempDir = this.dirs.modsTemp.dir(file.name)

			if (file.isExt('pak')) {
				try {
					await this.archiver.unpack(file.path, tempDir.path)
				} catch (error) {
					console.warn(`Se ignoró un .pak de mod no compatible: ${file.path}`, error)
					await tempDir.remove()
					return
				}

				if (await tempDir.dir('classes').exists()) {
					const modioFile = dir.file('modio.json')
					let name = file.name

					if (await modioFile.exists()) {
						const modIoName = (await modioFile.readFromJSON()).name
						const procedName = processNameForFilesystem(modIoName)

						if (!out.some(([, fileName]) => fileName === procedName)) {
							name = modIoName
						}
					}

					out.push([file, processNameForFilesystem(name)])
				}
			}
		}

		for (const entry of await dir.read()) {
			if (await entry.isFile()) {
				await processFile(entry.asFile(), dir)
			} else {
				const innerDir = entry.asDir()

				for (const innerEntry of await innerDir.read()) {
					if (await innerEntry.isDir()) {
						continue
					}

					await processFile(innerEntry.asFile(), innerDir)
				}
			}
		}

		return out
	}

	async getAllMods(): Promise<[IFile, string][]> {
		const env = di.resolve(ENV_TOKEN)

		const out: [IFile, string][] = []
		const home = userInfo().homedir || homedir() || env.home || ''
		const documentRoots = new Set([
			app.getPath('documents'),
			`${home}/Documents`,
			`${home}/Documentos`,
			process.env.OneDrive ? `${process.env.OneDrive}/Documents` : '',
			process.env.OneDrive ? `${process.env.OneDrive}/Documentos` : ''
		].filter(Boolean))
		const gameFolders = ['My Games', 'my games', 'mygames', 'MyGames']

		for (const root of documentRoots) {
			const documents = this.dirs.newDir(root)

			for (const gamesFolder of gameFolders) {
				const modsDir = documents.dir(`${gamesFolder}/SnowRunner/base/Mods/.modio/mods`)

				if (await modsDir.exists()) {
					out.push(...await this.findMods(modsDir))
					break
				}
			}
		}

		const unique = new Map(out.map(([file, name]) => [file.path.toLowerCase(), [file, name] as [IFile, string]]))
		out.length = 0
		out.push(...unique.values())

		for (const mod of this) {
			let isExists = false

			for (const [foundedMod] of out) {
				if (foundedMod.path === mod.path) {
					isExists = true
				}
			}

			if (!isExists) {
				out.push([mod.file, mod.name])
			}
		}

		return out
	}
}
