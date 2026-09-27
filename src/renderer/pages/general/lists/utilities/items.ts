import { TruckFileType, TruckXML } from '@modules/xml/renderer'
import { Category, SourceType } from '../../enums'

import type { IFile } from '@modules/files/renderer'
import { di } from '@utilities/di/container'
import { CONFIG_TOKEN, DIRS_TOKEN, DLC_TOKEN, MODS_TOKEN } from '@utilities/di/renderer/tokens'

export class ItemsUtils {
	async getMain(category: Category): Promise<IFile[]> {
		return this.filterByCategory(await this.getList(category, SourceType.main), category)
	}

	async getDLC(category: Category): Promise<IFile[]> {
		return this.filterByCategory(await this.getList(category, SourceType.dlc), category)
	}

	async getMods(category: Category): Promise<IFile[]> {
		const config = di.resolve(CONFIG_TOKEN)

		return config.useMods
			? this.filterByCategory(await this.getList(category, SourceType.mods), category)
			: []
	}

	private async filterByCategory(array: IFile[], category: Category): Promise<IFile[]> {
		const result: IFile[] = []

		for (const file of array) {
			const xml = await TruckXML.from(file)

			if (!xml?.exists()) {
				continue
			}

			const normalizedPath = file.path.replaceAll('\\', '/').toLowerCase()
			const isTrailer = normalizedPath.includes('/trucks/trailers/')
				|| xml.Type === TruckFileType.trailer

			if ((category === Category.trailers && isTrailer)
				|| (category === Category.trucks && !isTrailer)
			) {
				result.push(file)
			}
		}

		return result
	}

	private async getList(category: Category, from?: SourceType): Promise<IFile[]> {
		if (from === SourceType.dlc) {
			const dlcs = di.resolve(DLC_TOKEN)
			const array: IFile[] = []

			for (const dlc of dlcs) {
				const classes = dlc.dir.dir('classes')

				array.push(...await classes.dir('trucks')
					.findFiles({ ext: 'xml', recursive: true }))
			}

			return this.unique(array)
		}

		const dirs = di.resolve(DIRS_TOKEN)

		if (from === SourceType.mods) {
			const mods = di.resolve(MODS_TOKEN)
			const array: IFile[] = []

			for (const mod of mods) {
				const modClasses = dirs.modsTemp.dir(mod.name, 'classes')

				array.push(...await modClasses.dir('trucks')
					.findFiles({ ext: 'xml', recursive: true }))
			}

			return this.unique(array)
		}

		if (category === Category.trucks || category === Category.trailers) {
			return dirs.classes.dir('trucks').findFiles({ ext: 'xml', recursive: true })
		}

		return []
	}

	private unique(files: IFile[]) {
		return [...new Map(files.map(file => [file.path.toLowerCase(), file])).values()]
	}
}
