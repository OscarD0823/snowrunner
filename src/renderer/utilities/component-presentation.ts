import { loadLocalization, Localization, LocalizationStrings } from '@localization/renderer'
import type { IFile } from '@modules/files/types'
import { Engines, Wheels, WinchVariants } from '@modules/xml/renderer'
import { Category, type ComponentCategory } from '@renderer/pages/general/enums'
import { ItemsUtils } from '@renderer/pages/general/lists/utilities/items'
import { di } from '@utilities/di/container'
import { GAME_TEXTS_TOKEN, MODS_TOKEN } from '@utilities/di/renderer/tokens'
import { prettyString } from '@utilities/strings/renderer'

export const COMPONENT_PRESENTATION_TEXTS = loadLocalization(new Localization({
	compatible: new LocalizationStrings().es('Compatible con').en('Compatible with'),
	shared: new LocalizationStrings().es('Este archivo es compartido: los cambios afectan a todos los vehículos compatibles.').en('This is a shared file: changes affect every compatible vehicle.'),
	unassigned: new LocalizationStrings().es('Sin referencias directas en los vehículos instalados').en('No direct references in installed vehicles'),
	preview: new LocalizationStrings().es('Vista 3D representativa').en('Representative 3D preview'),
	previewHint: new LocalizationStrings().es('Geometría generada según las proporciones y el tipo de rueda. No es el modelo original ni muestra cambios de agarre.').en('Generated geometry based on wheel proportions and type. Not the original model; grip changes are not visualized.'),
	engine: new LocalizationStrings().es('Motores').en('Engines'),
	tire: new LocalizationStrings().es('Neumáticos').en('Tires'),
	winch: new LocalizationStrings().es('Cabrestantes').en('Winches'),
	heavy: new LocalizationStrings().es('Camiones pesados').en('Heavy trucks'),
	medium: new LocalizationStrings().es('Camiones medianos').en('Medium trucks'),
	scout: new LocalizationStrings().es('Exploradores').en('Scouts'),
	default: new LocalizationStrings().es('Estándar').en('Standard'),
	highway: new LocalizationStrings().es('Carretera').en('Highway'),
	allterrain: new LocalizationStrings().es('Todo terreno').en('All-terrain'),
	offroad: new LocalizationStrings().es('Todoterreno').en('Off-road'),
	mud: new LocalizationStrings().es('Barro').en('Mud'),
	chains: new LocalizationStrings().es('Con cadenas').en('Chained'),
	engineHint: new LocalizationStrings().es('Fuerza, consumo y resistencia al daño.').en('Pulling power, fuel consumption and damage tolerance.'),
	tireHint: new LocalizationStrings().es('Agarre en tierra, asfalto, barro y hielo.').en('Grip on dirt, asphalt, mud and ice.'),
	winchHint: new LocalizationStrings().es('Alcance, fuerza de arrastre y uso con el motor apagado.').en('Reach, pulling strength and engine-off operation.')
}))

export type ComponentPresentation = {
	title: string
	variants: string[]
	compatible: string[]
	hint: string
	radius?: number
	width?: number
	pattern?: string
}

let compatibility: Promise<Map<string, string[]>> | undefined
export function refreshComponentPresentation() { compatibility = undefined }

function indexKey(category: ComponentCategory, name: string, mod = '') {
	return `${category}:${mod}:${name.trim().toLowerCase()}`
}

async function buildCompatibility() {
	const result = new Map<string, Set<string>>()
	const items = new ItemsUtils()
	const files = (await Promise.all([items.getMain(Category.trucks), items.getDLC(Category.trucks), items.getMods(Category.trucks)])).flat()
	const { TruckXML } = await import('@modules/xml/renderer')
	const texts = di.resolve(GAME_TEXTS_TOKEN)
	const mods = di.resolve(MODS_TOKEN)
	await Promise.all(files.map(async file => {
		try {
			const xml = await TruckXML.from(file)
			if (!xml) return
			const mod = mods.getModID(file)
			const name = texts.get(xml.GameData?.UiDesc?.displayName, mod) ?? prettyString(file.name)
			for (const [category, selector] of [
				[Category.engines, 'EngineSocket'], [Category.wheels, 'CompatibleWheels'], [Category.winches, 'WinchUpgradeSocket']
			] as const) {
				for (const element of xml.selectAll(`TruckData > ${selector}`)) {
					for (const type of (element.getAttr('Type')?.str ?? '').split(',')) {
						if (!type.trim()) continue
						const key = indexKey(category, type, mod)
						const set = result.get(key) ?? new Set<string>()
						set.add(name)
						result.set(key, set)
					}
				}
			}
		} catch { /* Un archivo de mod ilegible no bloquea los demás. */ }
	}))
	return new Map([...result].map(([key, names]) => [key, [...names].sort()]))
}

export async function presentComponent(file: IFile, category: ComponentCategory): Promise<ComponentPresentation> {
	const texts = di.resolve(GAME_TEXTS_TOKEN)
	const mod = di.resolve(MODS_TOKEN).getModID(file)
	const localizedName = (variant: { Name?: string; GameData?: { UiDesc?: { UiName?: string } } }) =>
		texts.get(variant.GameData?.UiDesc?.UiName, mod) ?? variant.Name ?? ''
	let variants: string[] = []
	let wheels: Wheels | undefined
	if (category === Category.engines) variants = (await Engines.from(file))?.Engines.map(localizedName) ?? []
	else if (category === Category.wheels) {
		wheels = await Wheels.from(file)
		variants = wheels?.TruckTires?.Tires.map(localizedName) ?? []
	} else variants = (await WinchVariants.from(file))?.Winches.map(localizedName) ?? []
	const compatible = (await (compatibility ??= buildCompatibility())).get(indexKey(category, file.name, mod)) ?? []
	const t = COMPONENT_PRESENTATION_TEXTS
	const family = /heavy/.test(file.name) ? t.heavy : /scout/.test(file.name) ? t.scout : t.medium
	const surface = /chain/.test(file.name) ? t.chains : /mud/.test(file.name) ? t.mud : /offroad/.test(file.name) ? t.offroad : /allterrain/.test(file.name) ? t.allterrain : /highway/.test(file.name) ? t.highway : ''
	const kind = category === Category.engines ? t.engine : category === Category.wheels ? t.tire : t.winch
	const firstTire = wheels?.TruckTires?.Tires[0]
	const pattern = [file.name, firstTire?.getAttr('Mesh')?.str, firstTire?.getAttr('_template')?.str, firstTire?.GameData?.UiDesc?.UiDesc].join(' ').toLowerCase()
	const title = compatible.length === 1 ? `${kind} · ${compatible[0]}`
		: category === Category.wheels ? `${surface || kind} · ${family}`
		: `${kind} · ${/default/.test(file.name) ? t.default : family}`
	return {
		title, variants, compatible,
		hint: category === Category.engines ? t.engineHint : category === Category.wheels ? t.tireHint : t.winchHint,
		radius: wheels?.Radius, width: wheels?.Width, pattern
	}
}
