import type { UpdateInfo } from '@src/manual-updates'

/** Optional updates. Checking never downloads or installs the application. */
export interface IPublicUpdates {
	checkUpdates(): Promise<UpdateInfo>
	openUpdateDownload(): Promise<void>
	openUpdateRelease(): Promise<void>
}

export type IRendererUpdates = IPublicUpdates
export type IMainUpdates = IPublicUpdates
