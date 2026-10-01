import { publishInstanceFunction } from '@utilities/bridge/main'
import { di } from '@utilities/di/container'
import { IMAGES_TOKEN } from '@utilities/di/main/tokens'
import type { IMainImages } from './types'

/** Publica únicamente la extracción local de carátulas para el renderer. */
export function publishImages() {
	let instance: IMainImages
	const getInstance = () => instance ??= di.resolve(IMAGES_TOKEN)

	publishInstanceFunction('Images', 'prepare', getInstance)
}
