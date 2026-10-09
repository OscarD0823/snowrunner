import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function testJourney({ evaluate, call, output, selector = '.workspace-journey' }) {
  const originalStyle = await evaluate(`document.querySelector('${selector}').getAttribute('style')`)
  const duration = await evaluate(`document.querySelector('${selector} .journey-convoy').getAnimations()[0].effect.getComputedTiming().duration`)
  assert.equal(duration,selector === '.workspace-journey' ? 12000 : 9000)
  const seek = fraction => evaluate(`document.querySelector('${selector} svg').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=${fraction*duration}})`)
  const state = () => evaluate(`(()=>{const n=document.querySelector('${selector}'),m=new DOMMatrix(getComputedStyle(n.querySelector('.journey-convoy')).transform),opacity=s=>+getComputedStyle(n.querySelector(s)).opacity;return {x:m.e,y:m.f,tyre:getComputedStyle(n.querySelector('.rolling-wheel')).transform,snow:opacity('.journey-spray--snow'),dust:opacity('.journey-spray--dust'),mud:opacity('.journey-spray--mud')}})()`)
  const detailing=await evaluate(`(()=>{const n=document.querySelector('${selector}'),ids=[...n.querySelectorAll('[id]')].map(n=>n.id);return {unique:ids.length===new Set(ids).size,kind:n.querySelector('[data-vehicle-kind]').dataset.vehicleKind,particles:n.querySelectorAll('.terrain-particle').length,contacts:n.querySelectorAll('[data-wheel-contact]').length,emitters:[...n.querySelectorAll('[data-emitter]')].map(n=>n.dataset.emitter)}})()`)
  assert.equal(detailing.unique,true);assert.equal(detailing.kind,'expedition');assert.equal(detailing.contacts,3)
  assert.deepEqual(detailing.emitters,['rear-contact','front-contact']);assert.equal(detailing.particles,51)
  const frames=[]
  try {
    await call('Emulation.setDeviceMetricsOverride',{width:1000,height:600,deviceScaleFactor:1,mobile:false})
    await evaluate(`document.querySelector('${selector}').style.cssText+=';position:fixed;top:0;left:0;z-index:999999;width:900px;height:240px;max-width:none;flex:none;margin:0;'`)
    for(const [fraction,label,material] of [[.18,'nieve','snow'],[.4,'rocas','dust'],[.72,'barro','mud'],[.95,'estacionado',null]]){
      await seek(fraction)
      const result=await state()
      if(material)assert(result[material]>.6,'Missing ground contact effect: '+material)
      for(const other of ['snow','dust','mud'])if(other!==material)assert.equal(result[other],0,'Wrong terrain effect: '+other)
      await new Promise(r=>setTimeout(r,40))
      const shot=await call('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width:900,height:240,scale:1}})
      await writeFile(join(output,'journey-'+label+'.png'),Buffer.from(shot.data,'base64'))
      frames.push({fraction,label,...result})
    }
    await seek(.92);const parked=await state()
    await seek(.99);assert.equal((await state()).tyre,parked.tyre,'Parked expedition wheels must not spin')
    if(duration===12000){await seek(1.18);const repeated=await state();assert.equal(repeated.snow,1);assert.equal(repeated.mud,0)}
    const trajectory=await evaluate(`(()=>{const n=document.querySelector('.journey-spray--mud .terrain-particle'),a=n.getAnimations()[0],duration=a.effect.getComputedTiming().duration;a.currentTime=duration*.3;const up=new DOMMatrix(getComputedStyle(n).transform);a.currentTime=duration*.96;const down=new DOMMatrix(getComputedStyle(n).transform);return {up:{x:up.e,y:up.f},down:{x:down.e,y:down.f},radius:+n.getAttribute('r')}})()`)
    assert(trajectory.up.x<0 && trajectory.up.y<0 && trajectory.down.y>0,'Mud droplets must rise and fall')
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
    assert.equal(await evaluate(`document.querySelector('${selector} svg').getAnimations({subtree:true}).length`),0)
    const reduced=await state();assert.equal(reduced.x,637);assert.equal(reduced.mud,0);assert.equal(reduced.snow,0)
    await writeFile(join(output,'journey-results.json'),JSON.stringify({detailing,frames,trajectory,reduced},null,2))
    return frames
  } finally {
    await call('Emulation.setEmulatedMedia',{features:[]})
    await evaluate(`(()=>{const n=document.querySelector('${selector}');${originalStyle===null?'n.removeAttribute("style")':`n.setAttribute('style',${JSON.stringify(originalStyle)})`};n.querySelector('svg').getAnimations({subtree:true}).forEach(a=>a.play())})()`)
    await call('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false})
  }
}
