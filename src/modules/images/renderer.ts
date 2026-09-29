import { initMain, mainMethod } from '@bridge/renderer'
import type { Mods } from '@modules/data/modifications/renderer'
import type { IDirs, IFile } from '@modules/files/renderer'
import type { TruckXML } from '@modules/xml/renderer'
import type { Category } from '@renderer/pages/general/enums'
import { di, inject } from '@utilities/di/container'
import { APP_TOKEN, CONFIG_MANAGER_TOKEN, CONFIG_TOKEN, DIALOGS_TOKEN, DIRS_TOKEN, MODS_TOKEN } from '@utilities/di/renderer/tokens'
import type { Images as MainImages } from './main'
import type { IImages } from './types'

/** Работа с картинками. [renderer] */
@initMain()
export class Images implements IImages {
	@mainMethod()
	private prepare!: MainImages['prepare']
	/** Модификации игры. */
	@inject(MODS_TOKEN)
	private readonly mods!: Mods

	/** Основные папки. */
	@inject(DIRS_TOKEN)
	private readonly dirs!: IDirs

	/** Encontradas correctamente; evita volver a recorrer mods grandes. */
	private readonly modImages = new Map<string, string>()

	/** Carátulas leídas de gfx.pak, indexadas por UiIcon328x458. */
	private gameImages?: Promise<Record<string, string>>

	async getSrc(category: Category, file: IFile, xml: TruckXML): Promise<string> {
		const custom = di.resolve(CONFIG_TOKEN).customImages[this.customKey(category, file)]
		if (custom) return this.toFileUrl(custom)

		const images = this.dirs.newDir(this.getImagePath(category))
		const image = images.file(`${file.name}.webp`)
		const defaultImage = images.file('default.webp')
		const modID = this.mods.getModID(file)

		if (modID) {
			const modImage = await this.getModImage(file, xml)

			return modImage
				? modImage
				: defaultImage.path
		}

		const shopReference = xml.GameData?.UiDesc?.UiIcon328x458?.trim().toLowerCase()
		if (shopReference) {
			const extracted = await this.getGameImages()
			const extractedPath = extracted[shopReference]

			if (extractedPath) return this.toFileUrl(extractedPath)
		}

		return await this.imageExists(image)
			? image.path
			: defaultImage.path
	}

	private async getGameImages() {
		if (!this.gameImages) {
			const config = di.resolve(CONFIG_TOKEN)
			this.gameImages = config.initialPath
				? this.prepare(config.initialPath).catch(error => {
					console.warn('No se pudieron extraer las carátulas originales.', error)
					return {}
				})
				: Promise.resolve({})
		}

		return this.gameImages
	}

	getDefault(category: Category): string {
		return this.dirs.newDir(this.getImagePath(category)).file('default.webp').path
	}

	getGroupIconSrc(name: string): string {
		return this.getImagePath(`icons/${name}.webp`)
	}

	getImagePath(pathInImagesFolder: string) {
		const app = di.resolve(APP_TOKEN)
		const base = app.isDev
			? '/src'
			: '..'

		return `${base}/images/${pathInImagesFolder}`
	}

	async chooseCustom(category: Category, file: IFile) {
		const path = di.resolve(DIALOGS_TOKEN).getImage()
		if (!path) return

		const config = di.resolve(CONFIG_TOKEN)
		config.customImages[this.customKey(category, file)] = path
		await di.resolve(CONFIG_MANAGER_TOKEN).save()
		return this.toFileUrl(path)
	}

	async removeCustom(category: Category, file: IFile) {
		const config = di.resolve(CONFIG_TOKEN)
		delete config.customImages[this.customKey(category, file)]
		await di.resolve(CONFIG_MANAGER_TOKEN).save()
	}

	hasCustom(category: Category, file: IFile) {
		return Boolean(di.resolve(CONFIG_TOKEN).customImages[this.customKey(category, file)])
	}

	private customKey(category: Category, file: IFile) {
		return `${category}:${file.path.toLowerCase()}`
	}

	/**
	 * Получить модовую картинку.
	 * @param category Категория.
	 * @param file Файл.
	 * @param xml XML файла.
	 * @returns Модовая картинка.
	 */
	private async getModImage(file: IFile, xml: TruckXML): Promise<string | undefined> {
		const modName = this.mods.getModID(file)

		if (!modName || !xml.GameData?.UiDesc) {
			return
		}

		const rawReference = xml.GameData.UiDesc.UiIcon328x458?.trim()
		const cacheKey = `${modName}:${rawReference ?? file.name}`
		const cached = this.modImages.get(cacheKey)

		if (cached) {
			return cached
		}

		const modDir = this.dirs.modsTemp.dir(modName)
		const texturesDir = modDir.dir('ui', 'textures')
		const extensions = ['png', 'jpg', 'jpeg', 'webp']
		const referenceName = rawReference
			?.replace(/^['"]|['"]$/g, '')
			.split(/[\\/]/)
			.at(-1)
			?.replace(/\.(png|jpe?g|webp)$/i, '')

		if (referenceName) {
			for (const ext of extensions) {
				const candidate = texturesDir.file(`${referenceName}.${ext}`)

				if (await candidate.exists()) {
					return this.rememberModImage(cacheKey, candidate)
				}
			}
		}

		// Algunos mods no rellenan UiIcon328x458 o guardan la imagen en otra
		// subcarpeta. En ese caso elegimos primero miniaturas e iconos de tienda.
		const discovered: IFile[] = []

		for (const ext of extensions) {
			discovered.push(...await modDir.findFiles({ ext, recursive: true }))
		}

		const ranked = discovered.toSorted((a, b) => (
			this.imageRank(a.name, referenceName) - this.imageRank(b.name, referenceName)
		))
		const best = ranked.at(0)

		return best
			? this.rememberModImage(cacheKey, best)
			: undefined
	}

	private imageRank(name: string, referenceName?: string) {
		const normalized = name.toLowerCase()

		if (referenceName && normalized === referenceName.toLowerCase()) {
			return 0
		}

		const preferred = ['shop', 'preview', 'thumbnail', 'thumb', 'icon', 'logo']
		const index = preferred.findIndex(word => normalized.includes(word))

		return index >= 0 ? index + 1 : 100
	}

	private rememberModImage(key: string, file: IFile) {
		const url = this.toFileUrl(file.path)

		this.modImages.set(key, url)
		return url
	}

	private toFileUrl(path: string) {
		const normalized = path.replace(/\\/g, '/')
		const parts = normalized.split('/').map((part, index) => (
			index === 0 ? part : encodeURIComponent(part)
		))

		return `file:///${parts.join('/')}`
	}

	/**
	 * Существует ли картинка.
	 * @param file Файл картинки.
	 * @returns Существует ли картинка.
	 */
	private imageExists(file: IFile): Promise<boolean> {
		const image = new Image()

		return new Promise(resolve => {
			image.onload = () => resolve(true)
			image.onerror = () => resolve(false)
			image.src = file.path
		})
	}
}
