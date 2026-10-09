import { publishMain } from '@utilities/bridge/main/publisher'
import { registerDI } from '@utilities/di/main/registration'
import { app } from 'electron'
import squirrelStartup from 'electron-squirrel-startup'

if (squirrelStartup && !process.windowsStore) {
	app.quit()
} else {
	app.setAppUserModelId('com.squirrel.SnowRunnerStudio.SnowRunnerStudio')
	await registerDI()
	await publishMain()
	void runProgram()
}

/** Запустить программу. */
async function runProgram() {
	const { Program } = await import('./program')

	await new Program().init()
}
