/** Тип билда программы. */
export enum BuildType {
	/** Для разработки. */
	dev = 'dev',

	/** Для конечного пользователя. */
	prod = 'prod'
}

/** Язык интерфейса программы. */
export enum Lang {
	/** Español. */
	es = 'ES',

	/** Русский. */
	ru = 'RU',

	/** Английский. */
	en = 'EN',

	/** Немецкий. */
	de = 'DE',

	/** Китайский (упрощённый). */
	ch = 'ZH-CN',

	/** Français. */
	fr = 'FR',

	/** Italiano. */
	it = 'IT',

	/** Čeština. */
	cs = 'CS',

	/** 日本語. */
	ja = 'JA',

	/** 한국어. */
	ko = 'KO',

	/** Polski. */
	pl = 'PL',

	/** Português do Brasil. */
	ptBr = 'PT-BR',

	/** 中文（繁體）. */
	zhTw = 'ZH-TW'
}

/**
 * Преобразует строку в `Lang`.
 * _Если преобразование невозможно, возвращает `undefined`_
 * @param str Строка.
 * @returns Lang.
 */
export function strToLang(str?: string): Lang | undefined {
	if (!str) {
		return
	}

	const normalized = str.toUpperCase().replaceAll('_', '-')

	if (normalized === 'CH' || normalized === 'ZH' || normalized === 'ZH-HANS') {
		return Lang.ch
	}

	for (const value of Object.values(Lang)) {
		if (normalized === value) {
			return value
		}
	}
}

/**
 * Преобразует `locale` в `Lang`.
 * _Если преобразование невозможно, возвращает `undefined`_
 * @param locale Locale.
 * @returns Lang.
 */
export function localeToLang(locale?: string): Lang | undefined {
	if (!locale) {
		return
	}

	const langStr = locale.toLowerCase().replaceAll('_', '-')
	const exact: Record<string, Lang> = {
		'pt-br': Lang.ptBr,
		'zh-tw': Lang.zhTw,
		'zh-hk': Lang.zhTw,
		'zh-cn': Lang.ch,
		'zh-sg': Lang.ch
	}

	return exact[langStr]
		?? Object.values(Lang).find(value => langStr.startsWith(value.toLowerCase().split('-')[0]))
}

/**
 * Преобразует строку в `Lang`.
 * _Если преобразование невозможно, бросает ошибку `Error`_
 * @param str Строка.
 * @returns Lang.
 */
export function parseStrToLang(str: string): Lang | never {
	const value = strToLang(str)

	if (!value) {
		throw new Error(`Cannot parse '${str}' into Lang`)
	}

	return value
}
