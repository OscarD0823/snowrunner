import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
export async function testConsoleDesign({ evaluate, call, output }) {
  const results=[]
  for(const width of [600,960,1366]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:700,deviceScaleFactor:1,mobile:false})
    await evaluate('document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))')
    const state=await evaluate(`(()=>{
      const brief=document.querySelector('[data-game-brief]'),nav=document.querySelector('.workspace-navigation'),content=document.querySelector('.list');
      const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
      return {overflow:document.documentElement.scrollWidth>innerWidth,brief:rect(brief),nav:rect(nav),content:rect(content),steps:brief.querySelectorAll('ol li').length,
        active:nav.querySelectorAll('[aria-current="page"]').length,labels:[...nav.querySelectorAll('button')].map(b=>({title:b.title,display:getComputedStyle(b.lastElementChild).display}))};
    })()`)
    assert.equal(state.overflow,false,'Overflow at '+width)
    assert.equal(state.steps,3);assert.equal(state.active,1)
    const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
    await writeFile(join(output,'console-'+width+'.png'),Buffer.from(shot.data,'base64'))
    assert(state.content.height>180,'Library too small: '+JSON.stringify({width,...state}))
    assert(state.labels.every(item=>item.title&&item.display!=='none'),'Navigation labels hidden')
    if(width>760)assert(state.nav.right<=state.content.x,'Desktop sidebar missing')
    else assert(state.nav.bottom<=state.content.y,'Compact navigation covers content')
    results.push({width,...state})
  }
  await call('Emulation.setDeviceMetricsOverride',{width:600,height:520,deviceScaleFactor:1,mobile:false})
  const compact=await evaluate(`document.querySelector('.list').getBoundingClientRect().height`)
  assert(compact>120,'Short split-screen unusable')
  await call('Emulation.clearDeviceMetricsOverride')
  await writeFile(join(output,'console-design-results.json'),JSON.stringify(results,null,2))
  return results
}
