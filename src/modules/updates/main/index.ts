import { ManualUpdates } from '@src/manual-updates'
import { app, shell } from 'electron'
import type { IMainUpdates } from '../types'

/** GitHub is contacted only when the user requests a version check. */
export class Updates implements IMainUpdates {
	private readonly updates = new ManualUpdates('snowrunner', app.getVersion())

	checkUpdates() { return this.updates.check() }
	openUpdateDownload() { return shell.openExternal(this.updates.downloadUrl()) }
	openUpdateRelease() { return shell.openExternal(this.updates.releaseUrl()) }
}
