import { emitEvent } from 'emr-bridge/main'
import { ProgramWindow, WindowType } from '../enums'
import { PubKeys } from '../public'
import type { IGeneralWindow } from '../types'
import { getDevPage, getRenderer, newWindow } from './utilities'

/** Главное окно программы. */
export function getGeneralWindow() {
	return newWindow<IGeneralWindow>({
		windowType: WindowType.default,
		name: ProgramWindow.general,
		path: getRenderer('general/index.html'),
		devURL: getDevPage('general'),
		width: 1180,
		height: 760,
		minWidth: 600,
		minHeight: 520,

		async create(superCreate) {
			const win = await superCreate()

			win.route = page => emitEvent(PubKeys.routeEvent, page)

			return win
		}
	})
}
