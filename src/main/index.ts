import { publishMain } from '@utilities/bridge/main/publisher'
import { di } from '@utilities/di/container'
import { registerDI } from '@utilities/di/main/registration'
import { CONFIG_TOKEN } from '@utilities/di/main/tokens'
import { app } from 'electron'
import squirrelStartup from 'electron-squirrel-startup'
import { UpdateSourceType, updateElectronApp } from 'update-electron-app'

if (squirrelStartup && !process.windowsStore) {
	app.quit()
} else {
	app.setAppUserModelId('com.squirrel.SnowRunnerStudio.SnowRunnerStudio')
	await registerDI()
	await publishMain()
	initAutoUpdater()
	void runProgram()
}

function initAutoUpdater() {
	const config = di.resolve(CONFIG_TOKEN)

	// Las aplicaciones instaladas por Microsoft Store se actualizan mediante
	// la propia tienda; Squirrel/GitHub no debe modificar ese paquete.
	if (process.windowsStore || !app.isPackaged || !config.checkUpdates) {
		return
	}

	updateElectronApp({
		updateSource: {
			type: UpdateSourceType.ElectronPublicUpdateService,
			repo: 'OscarD0823/snowrunner'
		},
		updateInterval: '30 minutes',
		logger: console,
		notifyUser: true
	})
}

/** Запустить программу. */
async function runProgram() {
	const { Program } = await import('./program')

	await new Program().init()
}
