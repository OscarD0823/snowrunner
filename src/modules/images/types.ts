import type { IFile } from '@modules/files/types'
import type { TruckXML } from '@modules/xml/renderer'
import type { Category } from '@renderer/pages/general/enums'

/** Работа с картинками. [renderer] */
export interface IImages {
	/**
	 * Получить путь к картинке для данного файла автомобиля/прицепа.
	 * @param category Категория файла.
	 * @param file Файл.
	 * @param xml XML файла.
	 * @returns Путь к картинке для данного файла автомобиля/прицепа.
	 */
	getSrc(category: Category, file: IFile, xml: TruckXML): Promise<string>

	/**
	 * Получить путь к картинке по умолчанию.
	 * @param category Категория.
	 * @returns Путь к картинке по умолчанию.
	 */
	getDefault(category: Category): string

	/**
	 * Получить путь к иконке группы.
	 * @param name Название группы.
	 * @returns Путь к иконке группы.
	 */
	getGroupIconSrc(name: string): string

	/**
	 * Получить путь в папке `images`.
	 * @param pathInImagesFolder Название подпапки картинок в папке `images`.
	 * @returns Путь в папке `images`.
	 */
	getImagePath(pathInImagesFolder: string): string

	/** Elegir una carátula local para un elemento sin imagen oficial. */
	chooseCustom(category: Category, file: IFile): Promise<string | undefined>

	/** Quitar la carátula local asociada a un elemento. */
	removeCustom(category: Category, file: IFile): Promise<void>

	/** Indica si el elemento tiene una carátula elegida por el usuario. */
	hasCustom(category: Category, file: IFile): boolean

	/** Vaciar cachés y volver a leer carátulas tras buscar contenido nuevo. */
	refresh(): void
}

/** Preparación de carátulas originales. [main] */
export interface IMainImages {
	prepare(initialPath: string): Promise<Record<string, string>>
}
