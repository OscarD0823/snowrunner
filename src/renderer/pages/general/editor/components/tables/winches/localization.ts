import { Localization, LocalizationStrings } from '@localization'
import { loadLocalization } from '@localization/renderer'

export const WINCHES_LOCALIZATION = loadLocalization(new Localization({
	winch: new LocalizationStrings()
		.ru('Лебёдка')
		.en('Winch')
		.es('Cabrestante')
		.de('Seilwinde')
		.ch('绞车,绞车'),

	engine: new LocalizationStrings()
		.ru('Двигателя')
		.en('Engine')
		.es('Necesita el motor encendido')
		.de('Motor')
		.ch('发动机'),

	battery: new LocalizationStrings()
		.ru('Аккумулятора')
		.en('Battery')
		.es('Autónomo / batería')
		.de('Batterie')
		.ch('电池')
}))
