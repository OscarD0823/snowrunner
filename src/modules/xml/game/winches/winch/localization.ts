import { loadLocalization, Localization, LocalizationStrings } from '@localization/renderer'

export const WINCH_LOCALIZATION = loadLocalization(new Localization({
	name: new LocalizationStrings()
		.ru('Название')
		.en('Name')
		.es('Identificador del cabrestante')
		.de('Titel')
		.ch('标题'),

	length: new LocalizationStrings()
		.ru('Длина')
		.en('Length')
		.es('Alcance del cable (m)')
		.de('Länge')
		.ch('长度'),

	lengthDesc: new LocalizationStrings()
		.ru('Максимальная длина веревки лебедки')
		.en('Maximum length of the winch rope')
		.es('Distancia máxima a la que puedes enganchar el cable. Aumentarla permite alcanzar puntos más lejanos.')
		.de('Maximale Länge des Seilwinde'),

	strengthMult: new LocalizationStrings()
		.ru('Сила')
		.en('Strength')
		.es('Fuerza de arrastre (multiplicador)')
		.de('Stärke')
		.ch('力量'),

	strengthMultDesc: new LocalizationStrings()
		.es('Multiplica la fuerza del cabrestante: 1 es la fuerza base y 2 es el doble. Valores extremos pueden desestabilizar la física.')
		.en('Winch pulling strength multiplier: 1 is base strength, 2 is twice that. Extreme values can destabilize physics.'),

	isEngineIgnitionRequired: new LocalizationStrings()
		.ru('Работает от')
		.en('Works from')
		.es('Alimentación del cabrestante')
		.de('Arbeitet von')
		.ch('动力来源'),

	isEngineIgnitionRequiredDesc: new LocalizationStrings()
		.ru('Может ли лебёдка работать с заглушенным двигателем')
		.en('Can the winch work with the engine turned off')
		.es('Con motor encendido necesita que el motor funcione. Autónomo / batería permite usarlo con el motor apagado, por ejemplo al volcar.')
		.de('Kann die Winde mit einem abgeschalteten Motor arbeiten')
}))
