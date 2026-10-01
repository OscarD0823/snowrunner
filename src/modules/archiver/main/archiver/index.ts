import { ErrorText } from '@modules/errors/enums'
import { ProgramError } from '@modules/errors/main'
import type { IDir, IFile } from '@modules/files/types'
import { unzipSync, zipSync, type Unzipped } from 'fflate'
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import type { ISystemArchiver } from './types'

/**
 * Procesa los ZIP no estándar de SnowRunner sin ejecutables de terceros.
 * fflate conserva exactamente los separadores `\\` que usa el juego.
 */
export class ZipArchive implements ISystemArchiver {
	async update(dir: IDir, archive: IFile) {
		await archive.chmod(0o777)

		const archiveResult = await archive.canWrite()
		const dirResult = await dir.canRead()
		if (!archiveResult.result) {
			throw new ProgramError(ErrorText.writeFileError, archiveResult.error, archive.path)
		}
		if (!dirResult.result) {
			throw new ProgramError(ErrorText.readDirError, dirResult.error, dir.path)
		}

		const entries = unzipSync(new Uint8Array(await readFile(archive.path)))
		for (const localPath of await this.listFiles(dir.path)) {
			const entryName = relative(dir.path, localPath).replaceAll('/', '\\')
			entries[entryName] = new Uint8Array(await readFile(localPath))
		}

		await this.writeArchive(entries, archive.path)
	}

	async unpack(archive: IFile, dir: IDir) {
		const readResult = await archive.canRead()
		if (!readResult.result) {
			throw new ProgramError(ErrorText.readFileError, readResult.error, archive.path)
		}

		await dir.make()
		const writeResult = await dir.canWrite()
		if (!writeResult.result) {
			throw new ProgramError(ErrorText.writeDirError, writeResult.error, dir.path)
		}

		const raw = new Uint8Array(await readFile(archive.path))
		const isMain = this.isMainArchive(raw)
		const entries = unzipSync(raw, {
			filter: entry => this.shouldExtract(entry.name, isMain)
		})

		for (const [entryName, content] of Object.entries(entries)) {
			const target = this.safeTarget(dir.path, entryName)
			if (!target) continue
			await mkdir(dirname(target), { recursive: true })
			await writeFile(target, content)
		}
	}

	async add(file: IFile, archive: IFile) {
		const readResult = await file.canRead()
		const writeResult = await archive.canWrite()
		if (!readResult.result) {
			throw new ProgramError(ErrorText.readFileError, readResult.error, file.path)
		}
		if (!writeResult.result) {
			throw new ProgramError(ErrorText.writeFileError, writeResult.error, archive.path)
		}

		const entries = unzipSync(new Uint8Array(await readFile(archive.path)))
		entries[file.basename()] = new Uint8Array(await readFile(file.path))
		await this.writeArchive(entries, archive.path)
	}

	private isMainArchive(raw: Uint8Array) {
		const match = unzipSync(raw, {
			filter: entry => entry.name.toLowerCase() === '[media]\\classes\\trucks\\ank_mk38.xml'
		})
		return Object.keys(match).length > 0
	}

	private shouldExtract(rawName: string, isMain: boolean) {
		const name = rawName.replaceAll('\\', '/').toLowerCase()

		if (!isMain) {
			return ['classes/', 'texts/', 'ui/'].some(prefix => name.startsWith(prefix))
		}

		return name === 'edited'
			|| name === '[media]/_templates/trucks.xml'
			|| name.startsWith('[media]/_dlc/')
			|| [
				'[media]/classes/engines/',
				'[media]/classes/gearboxes/',
				'[media]/classes/suspensions/',
				'[media]/classes/trucks/',
				'[media]/classes/wheels/',
				'[media]/classes/winches/',
				'[strings]/strings_english.str',
				'[strings]/strings_russian.str',
				'[strings]/strings_chinese_simplified.str',
				'[strings]/strings_german.str'
			].some(prefix => name.startsWith(prefix))
	}

	private safeTarget(root: string, rawName: string) {
		const parts = rawName.replaceAll('\\', '/').split('/').filter(Boolean)
		const target = resolve(root, ...parts)
		const fromRoot = relative(resolve(root), target)

		return isAbsolute(fromRoot) || fromRoot.startsWith('..')
			? undefined
			: target
	}

	private async listFiles(root: string): Promise<string[]> {
		const result: string[] = []
		for (const entry of await readdir(root, { withFileTypes: true })) {
			const path = resolve(root, entry.name)
			if (entry.isDirectory()) result.push(...await this.listFiles(path))
			else if (entry.isFile()) result.push(path)
		}
		return result
	}

	private async writeArchive(entries: Unzipped, archivePath: string) {
		const tempPath = `${archivePath}.snowrunner-studio.tmp`
		try {
			const output = zipSync(entries, { level: 6 })
			// Una segunda lectura comprueba cabeceras, CRC y nombres internos antes
			// de tocar el archivo que usa el juego.
			const verified = unzipSync(output)
			if (Object.keys(verified).length !== Object.keys(entries).length) {
				throw new Error('El contenedor ZIP generado no superó la prueba de integridad.')
			}

			await writeFile(tempPath, output)
			await copyFile(tempPath, archivePath)
		} finally {
			await rm(tempPath, { force: true })
		}
	}
}
