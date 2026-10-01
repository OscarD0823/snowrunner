import { loadLocalization, Localization, LocalizationStrings } from '@localization/renderer'

export const WHEEL_FRICTION_LOCALIZATION = loadLocalization(new Localization({
	bodyFriction: new LocalizationStrings()
		.ru('Сцепление на бездорожье')
		.en('Body friction')
		.es('Agarre en tierra')
		.de('Körperreibung')
		.ch('在干土地上的摩擦力'),

	bodyFrictionDesc: new LocalizationStrings()
		.ru('Трение с грунтом, без грязи и других объектов')
		.en('Friction with the ground, without dirt and other objects')
		.es('Coeficiente de agarre en suelo firme sin asfalto ni barro. Un valor mayor reduce el deslizamiento en tierra.')
		.de('Reibung mit dem Boden, ohne Schmutz und andere Gegenstände'),

	bodyFrictionAsphalt: new LocalizationStrings()
		.ru('Сцепление на асфальте')
		.en('Body friction asphalt')
		.es('Agarre en asfalto')
		.de('Körperreibung asphalt')
		.ch('在公路上的摩擦力'),

	bodyFrictionAsphaltDesc: new LocalizationStrings()
		.ru('Трение с дорогой')
		.en('Friction with the road')
		.es('Coeficiente de agarre en carretera. Aumentarlo mejora la tracción sobre asfalto, no sobre barro.')
		.de('Reibung mit der Straße'),

	substanceFriction: new LocalizationStrings()
		.ru('Сцепление в грязи')
		.en('Substance friction')
		.es('Agarre en barro')
		.de('Substanzreibung')
		.ch('在泥浆里的摩擦力'),

	substanceFrictionDesc: new LocalizationStrings()
		.ru('Трение с грязью')
		.en('Friction with mud')
		.es('Coeficiente de agarre en superficies blandas como el barro. No cambia la anchura, el dibujo ni el modelo del neumático.')
		.de('Reiben mit Schmutz'),

	isIgnoreIce: new LocalizationStrings()
		.ru('Едет по льду')
		.en('Rides on ice')
		.es('Agarre especial en hielo')
		.de('Fahrten auf Eis')
		.ch('在冰上驾驶'),

	isIgnoreIceDesc: new LocalizationStrings()
		.ru('Имеет ли колесо хорошее сцепление на льду')
		.en('Does the wheel have good grip on ice')
		.es('Activa el tratamiento de agarre sobre hielo que usan las ruedas con cadenas. No añade cadenas al modelo visual.')
		.de('Hat das Rad einen guten Griff auf dem Eis')
}))
