/** Источник элемента. */
export enum SourceType {
	/** Все. */
	all = 'all',

	/** Модификации. */
	mods = 'mods',

	/** Дополнения. */
	dlc = 'dlc',

	/** Основной. */
	main = 'main',

	/** Избранное. */
	favorites = 'favorites',

	/** Изменённое. */
	edited = 'edited'
}

/** Категория в списках. */
export enum Category {
	/** Категория автомобилей. */
	trucks = 'trucks',

	/** Категория прицепов. */
	trailers = 'trailers',

	/** Catálogo de archivos de motores. */
	engines = 'engines',

	/** Catálogo de juegos de neumáticos. */
	wheels = 'wheels',

	/** Catálogo de cabrestantes. */
	winches = 'winches'
}

export type ComponentCategory = Category.engines | Category.wheels | Category.winches

export function isComponentCategory(category: Category): category is ComponentCategory {
	return category === Category.engines
		|| category === Category.wheels
		|| category === Category.winches
}

/** Режим списка. */
export enum ListMode {
	/** Список. */
	list = 'list',

	/** Карточки. */
	cards = 'cards'
}
