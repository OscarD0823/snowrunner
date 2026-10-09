import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Resize a snapshot of the actual startup DOM inside the same console parent.
// This keeps the real scoped/global styles but never changes loading or IPC state.
export async function testLoadingLayout({ call, output }) {
  const evaluate = async expression => {
    const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text)
    return response.result.value
  }
  const results = []
  try {
    assert(await evaluate(`!!document.querySelector('[data-loading-layout-clone] .splash')`), 'Actual startup screen was not captured')
    await evaluate(`document.querySelector('[data-loading-layout-clone] .splash').getAnimations().forEach(a=>{a.pause();a.currentTime=600})`)
    for (const [width,height] of [[600,520],[960,620],[1366,768],[600,360]]) {
      await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
      await evaluate('new Promise(r=>{const fallback=setTimeout(r,150);requestAnimationFrame(()=>requestAnimationFrame(()=>{clearTimeout(fallback);r()}))})')
      const state = await evaluate(`(()=>{
        const screen=document.querySelector('[data-loading-layout-clone]'),splash=screen.querySelector('.splash'),scene=screen.querySelector('.loading-journey'),details=screen.querySelector('.loading-details');
        const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
        return {width:innerWidth,height:innerHeight,display:getComputedStyle(screen).display,position:getComputedStyle(screen).position,screen:rect(screen),splash:rect(splash),scene:rect(scene),details:rect(details),
          overflow:document.documentElement.scrollWidth>innerWidth,title:screen.querySelector('.title').textContent.trim(),
          progress:screen.querySelectorAll('.progress,.activity-dots').length,animations:screen.querySelectorAll('.startup-journey').length,
          brokenImages:[...screen.querySelectorAll('img')].filter(image=>image.complete&&image.naturalWidth===0).map(image=>image.src)};
      })()`)
      assert.equal(state.display,'grid','Console menu styles broke the loading container')
      assert.equal(state.position,'fixed')
      assert.equal(state.overflow,false)
      assert.equal(state.progress,1,'Progress indicator duplicated or missing')
      assert.equal(state.animations,1)
      assert.deepEqual(state.brokenImages,[])
      assert(state.title)
      assert(state.splash.x>=0&&state.splash.right<=width&&state.splash.y>=0&&state.splash.bottom<=height,'Startup card escapes viewport: '+JSON.stringify(state))
      assert(Math.abs(state.splash.x+state.splash.width/2-width/2)<=1,'Startup card not centered horizontally')
      assert(state.scene.bottom<=state.details.y&&state.details.bottom<=state.splash.bottom,'Scene overlaps loading status')
      const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
      await writeFile(join(output,'loading-'+width+'x'+height+'.png'),Buffer.from(shot.data,'base64'))
      if (width===600&&height===520) await writeFile(join(output,'startup-animation.png'),Buffer.from(shot.data,'base64'))
      results.push(state)
    }
    await evaluate(`document.querySelector('[data-loading-layout-clone] .title').textContent='Comprobando las imágenes, los modelos y los archivos del vehículo seleccionado para preparar la próxima expedición…'`)
    const longText=await evaluate(`(()=>{const screen=document.querySelector('[data-loading-layout-clone]'),r=screen.querySelector('.splash').getBoundingClientRect(),details=screen.querySelector('.loading-details');return {top:r.top,bottom:r.bottom,right:r.right,scrollWidth:details.scrollWidth,clientWidth:details.clientWidth}})()`)
    assert(longText.top>=0&&longText.bottom<=360&&longText.right<=600&&longText.scrollWidth<=longText.clientWidth,'Long loading messages overflow')
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
    assert.equal(await evaluate(`document.querySelector('[data-loading-layout-clone]').getAnimations({subtree:true}).length`),0,'Reduced motion not respected during loading')
    await writeFile(join(output,'loading-layout-results.json'),JSON.stringify({results,longText},null,2))
    return results
  } finally {
    await call('Emulation.setEmulatedMedia',{features:[]})
    await call('Emulation.clearDeviceMetricsOverride')
    await evaluate(`document.querySelector('[data-loading-layout-clone]')?.remove()`)
  }
}
