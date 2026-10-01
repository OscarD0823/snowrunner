import { strict as assert } from 'node:assert'
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { strFromU8, unzipSync } from 'fflate'
import { ZipArchive } from '../src/modules/archiver/main/archiver/index'

const repo = resolve(import.meta.dirname, '..')
const fixture = join(repo, '.snowrunner-data', 'backups', 'initial.pak')
const root = join(repo, '.archive-verification')
const archivePath = join(root, 'initial-test.pak')
const unpackedPath = join(root, 'unpacked')

assert(root.startsWith(`${repo}\\`), 'La carpeta temporal debe estar dentro del repositorio')
await rm(root, { recursive: true, force: true })
await mkdir(unpackedPath, { recursive: true })
await copyFile(fixture, archivePath)

const archive = new ZipArchive()
const file = {
	path: archivePath,
	chmod: async() => {},
	canRead: async() => ({ result: true }),
	canWrite: async() => ({ result: true })
}
const dir = {
	path: unpackedPath,
	make: async() => mkdir(unpackedPath, { recursive: true }),
	canRead: async() => ({ result: true }),
	canWrite: async() => ({ result: true })
}

try {
	await archive.unpack(file as any, dir as any)
	const trucks = await readdir(join(unpackedPath, '[media]', 'classes', 'trucks'))
	assert(trucks.filter(name => name.endsWith('.xml')).length >= 40, 'No se extrajo el catálogo base de camiones')
	const dlcs = await readdir(join(unpackedPath, '[media]', '_dlc'))
	assert(dlcs.length >= 15, 'No se extrajo el contenido DLC')
	const strings = await readdir(join(unpackedPath, '[strings]'))
	assert(strings.includes('strings_spanish.str'), 'Se omitió la traducción española')
	assert(strings.length >= 13, 'Se omitieron idiomas del juego')

	const enginePath = join(unpackedPath, '[media]', 'classes', 'engines', 'e_us_truck_old.xml')
	const marker = '<!-- archive verification -->'
	await writeFile(enginePath, `${await readFile(enginePath, 'utf8')}\n${marker}`)
	const spanishPath = join(unpackedPath, '[strings]', 'strings_spanish.str')
	await rm(spanishPath)
	await archive.extractMissingStrings(archivePath, unpackedPath)
	assert((await readFile(spanishPath)).length > 0, 'La migración no recuperó el español')
	assert((await readFile(enginePath, 'utf8')).includes(marker), 'La migración sobrescribió ajustes del usuario')
	await writeFile(join(unpackedPath, 'edited'), '')
	await archive.update(dir as any, file as any)

	const verified = unzipSync(new Uint8Array(await readFile(archivePath)))
	assert(verified['[media]\\classes\\engines\\e_us_truck_old.xml'], 'Se perdieron los separadores internos de SnowRunner')
	assert(strFromU8(verified['[media]\\classes\\engines\\e_us_truck_old.xml']).includes(marker), 'No se guardó el XML modificado')
	assert(verified.edited, 'No se guardó el marcador de edición')

	console.log(`Archivo SnowRunner verificado: ${Object.keys(verified).length} entradas, rutas internas y XML modificado íntegros.`)
} finally {
	await rm(root, { recursive: true, force: true })
}
