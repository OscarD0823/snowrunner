import type { IInputAreas, InputArea } from '../types'
import type { Limit } from '@modules/xml/renderer'

export type RecommendationLevel = 'low' | 'medium' | 'high'
export type SafeRecommendation = {
	level: RecommendationLevel
	value: number
}

const INCREASE = new Set([
	'Responsiveness',
	'BackSteerSpeed',
	'SteerSpeed',
	'Length',
	'StrengthMult',
	'SteeringAngle',
	'Scale',
	'DamageCapacity',
	'Torque',
	'DamagedMinTorqueMultiplier',
	'DamagedMaxTorqueMultiplier',
	'MaxDeltaAngVel',
	'BodyFriction',
	'BodyFrictionAsphalt',
	'SubstanceFriction',
	'Height',
	'Strength',
	'SuspensionStrength',
	'SuspensionMax',
	'FuelCapacity',
	'WaterCapacity',
	'RepairsCapacity',
	'WheelRepairsCapacity',
	'AngVel'
])

const DECREASE = new Set([
	'FuelConsumption',
	'AWDConsumptionModifier',
	'IdleFuelModifier',
	'FuelModifier',
	'DamagedConsumptionModifier',
	'BrakesDelay',
	'EngineStartDelay',
	'ExhaustStartTime',
	'EngineResponsiveness'
])

const LEVELS: [RecommendationLevel, number][] = [
	['low', 0.05],
	['medium', 0.10],
	['high', 0.15]
]

/**
 * Perfiles conservadores: como máximo modifican un 15 % el valor original,
 * respetan los límites del descriptor y nunca entran en zonas amarillas/rojas.
 */
export function getSafeRecommendations(
	name: string,
	original: number,
	step?: number,
	limit?: Limit,
	areas?: IInputAreas
): SafeRecommendation[] {
	const direction = INCREASE.has(name)
		? 1
		: DECREASE.has(name)
			? -1
			: 0

	if (!direction || !Number.isFinite(original) || original === 0) {
		return []
	}

	let min = limit?.minValue ?? Number.NEGATIVE_INFINITY
	let max = limit?.maxValue ?? Number.POSITIVE_INFINITY
	const margin = Math.max(Math.abs(step ?? 0), Math.abs(original) * 0.001, 0.0001)
	const unsafeAreas = [...toAreas(areas?.yellow), ...toAreas(areas?.red)]

	for (const [start, end] of unsafeAreas) {
		if (direction > 0 && start >= original) {
			max = Math.min(max, start - margin)
		}

		if (direction < 0 && end <= original) {
			min = Math.max(min, end + margin)
		}
	}

	const recommendations = LEVELS.map(([level, ratio]) => {
		const raw = original + direction * Math.abs(original) * ratio
		const bounded = Math.min(max, Math.max(min, raw))

		return { level, value: roundToStep(bounded, step, limit) }
	})

	return recommendations.filter((item, index) => (
		item.value !== original
		&& recommendations.findIndex(other => other.value === item.value) === index
	))
}

function toAreas(area?: InputArea | InputArea[]): InputArea[] {
	if (!area) {
		return []
	}

	return typeof area[0] === 'number'
		? [area as InputArea]
		: area as InputArea[]
}

function roundToStep(value: number, step?: number, limit?: Limit) {
	const stepped = step
		? Math.round(value / step) * step
		: Number(value.toFixed(4))
	const rounded = limit?.lim(stepped) ?? stepped

	return Number(rounded.toFixed(6))
}
