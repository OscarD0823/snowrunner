import { load } from 'cheerio'
import { stat } from 'node:fs/promises'
import { readGameEntry } from './game-archive'
import type { GamePaint } from './types'

export function parseGamePaints(source: string) {
  const xml = load(source, { xmlMode: true }), result = new Map<string, GamePaint>()
  xml('TruckSet > Truck').each((_, truck) => {
    const name = xml(truck).attr('Name'), presets = xml(truck).find('CustomizationPreset')
    const preset = presets.filter((_,p)=>xml(p).attr('Id') === '0').first()
    const override = preset.attr('MaterialOverrideName')
    if (!name || !override) return
    const colors: [number, number, number][] = []
    for (const key of ['TintColor1','TintColor2','TintColor3']) {
      const raw = preset.attr(key), values = raw?.match(/\d+(?:\.\d+)?/g)?.map(Number)
      if (!raw?.startsWith('g(') || values?.length !== 3 || values.some(n=>n<0 || n>255)) return
      colors.push(values as [number,number,number])
    }
    result.set(name.toLowerCase(),{override,colors})
  })
  return result
}

const cache = new Map<string, { signature: string; paints: Promise<Map<string,GamePaint>> }>()
export async function readGamePaint(path: string, name: string) {
  const info = await stat(path), signature = `${info.size}:${info.mtimeMs}`
  let cached = cache.get(path)
  if (!cached || cached.signature !== signature) {
    const paints = readGameEntry(path,'[media]/classes/customization_presets/customization_preset.xml',8*1024*1024)
      .then(bytes=>parseGamePaints(bytes?.toString('utf8') ?? ''))
    cached = {signature,paints}; cache.set(path,cached)
  }
  return (await cached.paints).get(name.toLowerCase())
}
