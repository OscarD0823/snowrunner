import { loadLocalization, Localization, LocalizationStrings } from '@localization/renderer'

export const ENGINE_LOCALIZATION = loadLocalization(new Localization({
	name: new LocalizationStrings()
		.ru('Название')
		.en('Name')
		.es('Identificador del motor')
		.de('Titel')
		.ch('标题'),

	responsiveness: new LocalizationStrings()
		.ru('Отзывчивость')
		.en('Responsiveness')
		.es('Rapidez al subir de revoluciones')
		.de('Empfänglichkeit')
		.ch('引擎转速增加的速度'),

	responsivenessDesc: new LocalizationStrings()
		.ru('Отзывчивость двигателя (скорость набирания оборотов)')
		.en('Engine responsiveness (revving speed)')
		.es('Controla qué tan rápido responde el motor al acelerador. Un valor mayor hace la respuesta más rápida.')
		.de('Reaktionsfähigkeit des Motors (Drehzahl)'),

	fuelConsumption: new LocalizationStrings()
		.ru('Потребление топлива')
		.en('Fuel consumption')
		.es('Consumo base de combustible')
		.de('Kraftstoffverbrauch')
		.ch('油耗'),

	fuelConsumptionDesc: new LocalizationStrings()
		.ru('Базовое потребление топлива двигателем')
		.en('The basic fuel consumption of the engine')
		.es('Coeficiente de consumo del motor. Al bajarlo gastarás menos combustible; no es una lectura directa en litros por minuto.')
		.de('Basiskraftstoffverbrauch durch den Motor'),

	damagedConsumptionModifier: new LocalizationStrings()
		.ru('Множитель потребления топлива при повреждении')
		.en('Damage consumption modifier')
		.es('Consumo extra por daño (multiplicador)')
		.de('Schadensverbrauchsmodifikator')
		.ch('损伤时油耗增加的倍数'),

	damagedConsumptionModifierDesc: new LocalizationStrings()
		.ru('Максимальное значение изменения расхода при поломке двигателя')
		.en('The maximum value of the flow rate change in case of engine failure')
		.es('Multiplica el consumo cuando el motor está dañado: 1 mantiene el consumo base y 2 puede duplicarlo.')
		.de('Maximale Durchflussänderung bei Motorschaden'),

	torque: new LocalizationStrings()
		.ru('Крутящий момент')
		.en('Torque')
		.es('Fuerza del motor (par)')
		.de('Drehmoment')
		.ch('马力'),

	torqueDesc: new LocalizationStrings()
		.ru('Мощность двигателя')
		.en('Engine power')
		.es('Controla la fuerza de arrastre y la capacidad de mover carga. Son unidades internas del juego, no caballos de potencia.')
		.de('Motorleistung'),

	damagedMinTorqueModifier: new LocalizationStrings()
		.ru('Мин. множитель мощности при повреждении')
		.en('Damaged min torque modifier')
		.es('Fuerza al empezar el daño crítico')
		.de('Beschädigter min Drehmomentmodifikator')
		.ch('损坏时马力输出倍数'),

	damagedMinTorqueModifierDesc: new LocalizationStrings()
		.ru('Множитель мощности, когда ущерб движка достиг порога поломки')
		.en('Power multiplier when engine damage has reached the breakdown threshold')
		.es('Fracción de fuerza conservada al alcanzar el umbral de daño: 0.5 conserva la mitad y 1 conserva toda.')
		.de('Leistungsmultiplikator, wenn der Motorschaden die Bruchschwelle erreicht hat'),

	damagedMaxTorqueModifier: new LocalizationStrings()
		.ru('Макс. множитель мощности при повреждении')
		.en('Damaged max torque modifier')
		.es('Fuerza con el motor casi destruido')
		.de('Beschädigte max Drehmoment-Modifikator')
		.ch('严重损坏时马力输出倍数'),

	damagedMaxTorqueModifierDesc: new LocalizationStrings()
		.ru('Множитель мощности, когда движок близок к полной поломке (к 0 прочности)')
		.en('Power multiplier when the engine is close to complete breakdown (to 0 strength)')
		.es('Fracción de fuerza conservada cerca del daño máximo. 0 elimina la fuerza y 1 la conserva.')
		.de('Leistungsmultiplikator, wenn der Motor nahe an einem vollständigen Bruch liegt (bei 0 Stärke)'),

	brakesDelay: new LocalizationStrings()
		.ru('Задержка торможения')
		.en('Braking delay')
		.es('Retardo de frenado')
		.de('Verzögerung beim Bremsen')
		.ch('制动延迟'),

	brakesDelayDesc: new LocalizationStrings()
		.ru('Задержка при торможении')
		.en('Braking delay')
		.es('Retardo de la respuesta al frenar. Un valor menor reduce la espera; conserva valores cercanos al original.')
		.de('Verzögerung beim Bremsen'),

	maxDeltaAngVel: new LocalizationStrings()
		.ru('Макс. дельта угловой скорости')
		.en('Max angular velocity delta')
		.es('Límite de aceleración de las ruedas')
		.de('maximale Winkelgeschwindigkeit Delta')
		.ch('加速的减速'),

	maxDeltaAngVelDesc: new LocalizationStrings()
		.ru('Ограничитель максимального углового ускорения колёс. Чем он меньше, тем медленнее разгоняется машина')
		.en('The limiter of the maximum angular acceleration of the wheels. The smaller it is, the slower the car accelerates')
		.es('Limita cuánto puede aumentar la velocidad de giro de las ruedas. Un valor menor ralentiza la aceleración.')
		.de('Begrenzer für maximale Winkelbeschleunigung der Räder. Je kleiner es ist, desto langsamer beschleunigt das Auto'),

	criticalDamageThreshold: new LocalizationStrings()
		.ru('Порог критического повреждения')
		.en('Critical damage threshold')
		.es('Umbral de daño crítico (0 a 1)')
		.de('Kritische Schadensschwelle')
		.ch('损坏阈值'),

	criticalDamageThresholdDesc: new LocalizationStrings()
		.ru('Порог критической поломки. После этого порога изменяется расход топлива и мощность двигателя')
		.en('The threshold of critical failure. After this threshold, the fuel consumption and engine power change')
		.es('A partir de este nivel de daño se aplican las penalizaciones de consumo y fuerza del motor. Por ejemplo, 0.5 equivale al 50 %.')
		.de('Kritische Bruchschwelle. Nach dieser Schwelle ändert sich der Kraftstoffverbrauch und die Motorleistung'),

	damageCapacity: new LocalizationStrings()
		.ru('Прочность')
		.en('Damage capacity')
		.es('Resistencia del motor (puntos de daño)')
		.de('Schadenskapazität')
		.ch('血量'),

	damageCapacityDesc: new LocalizationStrings()
		.ru('Размер допустимого ущерба двигателю')
		.en('The amount of possible damage to the engine')
		.es('Cantidad de daño que soporta el motor antes de quedar destruido. Un valor mayor aumenta su resistencia.')
		.de('Die Größe des zulässigen Motorschadens')
}))
