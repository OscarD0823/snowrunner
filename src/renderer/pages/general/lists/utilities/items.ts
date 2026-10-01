import { Engines, TruckFileType, TruckXML, Wheels, WinchVariants } from '@modules/xml/renderer'
import { Category, SourceType, isComponentCategory } from '../../enums'

import type { IDir, IFile } from '@modules/files/renderer'
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
		const classified = await Promise.all(array.map(async file => {
			if (isComponentCategory(category)) {
				const xml = category === Category.engines
					? await Engines.from(file)
					: category === Category.wheels
						? await Wheels.from(file)
						: await WinchVariants.from(file)

				return xml?.exists() ? file : undefined
			}

			const xml = await TruckXML.from(file)

			if (!xml?.exists()) {
				return
			}

			const normalizedPath = file.path.replaceAll('\\', '/').toLowerCase()
			const isTrailer = normalizedPath.includes('/trucks/trailers/')
				|| xml.Type === TruckFileType.trailer

			return (category === Category.trailers && isTrailer)
				|| (category === Category.trucks && !isTrailer)
				? file
				: undefined
		}))

		return classified.filter((file): file is IFile => Boolean(file))
	}

	private async getList(category: Category, from?: SourceType): Promise<IFile[]> {
		const folder = this.getFolder(category)

		if (from === SourceType.dlc) {
			const dlcs = di.resolve(DLC_TOKEN)
			const array: IFile[] = []

			for (const dlc of dlcs) {
				const classes = dlc.dir.dir('classes')

				array.push(...isComponentCategory(category)
					? await classes.dir(folder).findFiles({ ext: 'xml' })
					: await this.findCatalogFiles(classes.dir('trucks'))
				)
			}

			return this.unique(array)
		}

		const dirs = di.resolve(DIRS_TOKEN)

		if (from === SourceType.mods) {
			const mods = di.resolve(MODS_TOKEN)
			const array: IFile[] = []

			for (const mod of mods) {
				const modClasses = dirs.modsTemp.dir(mod.name, 'classes')

				array.push(...isComponentCategory(category)
					? await modClasses.dir(folder).findFiles({ ext: 'xml' })
					: await this.findCatalogFiles(modClasses.dir('trucks'))
				)
			}

			return this.unique(array)
		}

		if (category === Category.trucks || category === Category.trailers) {
			return this.findCatalogFiles(dirs.classes.dir('trucks'))
		}

		return dirs.classes.dir(folder).findFiles({ ext: 'xml' })
	}

	private getFolder(category: Category) {
		return category === Category.engines
			? 'engines'
			: category === Category.wheels
				? 'wheels'
				: category === Category.winches
					? 'winches'
					: 'trucks'
	}

	/**
	 * Los vehículos reales están en la raíz de `classes/trucks` y los
	 * remolques en `classes/trucks/trailers`. Evitar una búsqueda recursiva
	 * impide que el catálogo intente abrir cientos de accesorios y archivos
	 * de personalización como si fueran vehículos.
	 */
	private async findCatalogFiles(trucks: IDir) {
		const [vehicles, trailers] = await Promise.all([
			trucks.findFiles({ ext: 'xml' }),
			trucks.dir('trailers').findFiles({ ext: 'xml' })
		])

		return [...vehicles, ...trailers]
	}

	private unique(files: IFile[]) {
		return [...new Map(files.map(file => [file.path.toLowerCase(), file])).values()]
	}
}
