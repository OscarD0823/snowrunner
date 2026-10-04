import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { openPromise } from 'yauzl'

const root=process.cwd(),appRoot=join(root,'out/SnowRunner Studio-win32-x64/resources/app')
const version=JSON.parse(await readFile(join(root,'package.json'),'utf8')).version
assert.equal(JSON.parse(await readFile(join(appRoot,'package.json'),'utf8')).version,version)
async function hash(stream){const h=createHash('sha256');for await(const chunk of stream)h.update(chunk);return h.digest('hex')}
async function files(directory){const result=[];for(const entry of await readdir(directory,{withFileTypes:true})){const path=join(directory,entry.name);if(entry.isDirectory())result.push(...await files(path));else if(entry.isFile())result.push(path);else throw new Error('Unexpected link in distribution: '+path)}return result}
const portable=new Map()
for(const file of await files(appRoot))portable.set(relative(appRoot,file).replaceAll('\\','/'),await hash(createReadStream(file)))
assert.deepEqual([...portable.keys()].filter(n=>/\.(?:pak|tpl(?:_data)?|pct(?:_mip)?|fbx|dds|tga)$/i.test(n)),[],'Game assets must not be distributed')
assert.deepEqual([...portable.keys()].filter(n=>/ui-smoke|game-images|game-models/i.test(n)),[],'QA output must not be distributed')
const renderers=[...portable.keys()].filter(n=>/\.vite\/renderer\/(?:.*\/)?assets\/[^/]+\.js$/.test(n))
assert(renderers.length,'Missing renderer bundle')
const bundle=(await Promise.all(renderers.map(n=>readFile(join(appRoot,n),'utf8')))).join('\n')
for(const key of ['data-project-link','https://github.com/OscarD0823','https://github.com/OscarD0823/snowrunner'])assert(bundle.includes(key),'Missing identity/link in renderer: '+key)
const releases=(await readFile(join(root,'out/make/squirrel.windows/x64/RELEASES'),'utf8')).trim().split(/\s+/)
assert(releases[1].includes('-'+version+'-'))
const pkg=join(root,'out/make/squirrel.windows/x64',releases[1])
assert.equal(Number(releases[2]),(await stat(pkg)).size)
assert.equal(releases[0].toLowerCase(),createHash('sha1').update(await readFile(pkg)).digest('hex'))
const zip=await openPromise(pkg,{lazyEntries:true,strictFileNames:true,validateEntrySizes:true}),seen=new Set()
try {
  for await(const entry of zip.eachEntry()){
    const marker='/resources/app/',index=entry.fileName.indexOf(marker)
    if(index<0||entry.fileName.endsWith('/'))continue
    const name=entry.fileName.slice(index+marker.length)
    assert.equal(await hash(await zip.openReadStreamPromise(entry)),portable.get(name),'Installer/portable mismatch: '+name);seen.add(name)
  }
} finally {if(zip.isOpen)zip.close()}
assert.equal(seen.size,portable.size,'Installer application files missing')
const appHash=createHash('sha256').update(JSON.stringify([...portable].sort(([a],[b])=>a.localeCompare(b)))).digest('hex')
console.log(JSON.stringify({version,files:portable.size,appHash,installerMatches:true,noBundledGameAssets:true}))
