<template>
  <div class="startup-journey" :class="{ 'startup-journey--loop': loop }" aria-hidden="true">
    <svg viewBox="0 0 900 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient :id="`${id}-sky`" x2="0" y2="1">
          <stop stop-color="#101f2d" /><stop offset=".7" stop-color="#33525e" /><stop offset="1" stop-color="#d29b68" />
        </linearGradient>
        <linearGradient :id="`${id}-snow-ground`" x2="0" y2="1"><stop stop-color="#e8eeea"/><stop offset="1" stop-color="#839ba0"/></linearGradient>
        <linearGradient :id="`${id}-wet-ground`" x2="0" y2="1"><stop stop-color="#99aaa2"/><stop offset=".2" stop-color="#6b6050"/><stop offset="1" stop-color="#352c25"/></linearGradient>
        <pattern :id="`${id}-grain`" width="43" height="19" patternUnits="userSpaceOnUse"><path d="m2 3 5 1m13 8 8-1m9-7 3 1M4 16h3" stroke="#1b2a28" stroke-width=".8" opacity=".25"/><circle cx="15" cy="3" r=".6" fill="#dce2d1" opacity=".4"/></pattern>
      </defs>
      <rect width="900" height="240" rx="18" :fill="`url(#${id}-sky)`" />
      <circle class="journey-sun" cx="696" cy="85" r="34" fill="#f2bc80" opacity=".32" />
      <g class="journey-mountains">
        <path d="M0 131 94 46 148 92 245 14 359 107 433 53 573 136 687 37 784 109 854 60 900 109V220H0Z" fill="#73929b" opacity=".4" />
        <path d="m198 62 47-48 48 50-31-9-17 11-13-16zM649 74l38-37 38 36-26-6-12 11-10-16zM65 73l29-27 31 30-21-6-10 9-9-13z" fill="#c6d7d9" opacity=".74" />
        <path d="M0 151 92 119 192 143 296 96 427 151 543 104 659 146 788 105 900 143V230H0Z" fill="#253f48" />
      </g>
      <g fill="#152d31" opacity=".85">
        <path v-for="(x, i) of [8, 25, 143, 165, 290, 309, 542, 565, 785, 809, 861, 879]" :key="x" :transform="`translate(${x},${i % 3 * 6 + 107})`" d="M0 50h8V29h15L5-11-13 29H0Z" />
      </g>
      <!-- Tres terrenos reconocibles, con relieve y huellas propias. -->
      <path d="M0 183q81-33 168-9t121-5q68-50 134-13t116 20q90 35 169 4t192-10V240H0Z" fill="#283e3d" />
      <path d="M0 197q89-36 182-7t122-18l-31 47H0Z" :fill="`url(#${id}-snow-ground)`" />
      <path d="M0 207q106-38 203-10l-19 11q-88-24-184 13Z" fill="#edf3ef" opacity=".6" />
      <path d="m315 185 34-36 26 2 25 21 31-8 25 31-16 19-145 3Z" fill="#62716d" />
      <path d="m349 149 26 2 25 21-29-7-15 13-20-4Z" fill="#9ca69a" />
      <path d="m315 185 21-11 20 4 15-13 29 7m-44 6 9 24m35-30 10 21 21-29" stroke="#354e4e" stroke-width="2" fill="none"/>
      <path d="M474 206q96-39 194-12t119 13l-27 25H471Z" fill="#583d2d" />
      <path class="journey-mud" d="M521 211q76-27 137-10t74 9q-70 25-211 1Z" :fill="`url(#${id}-wet-ground)`" opacity=".9" />
      <path d="M530 210q73-17 138-7m-123 13q65 6 141-1" stroke="#c1c4ab" stroke-width=".9" fill="none" opacity=".45"/>
      <path d="M480 220q97-30 199-8M480 225q95-29 199-7" fill="none" stroke="#261e1b" stroke-width="2" opacity=".55"/>
      <path d="M0 207q106-38 203-10M7 212q106-38 203-10" fill="none" stroke="#758e93" stroke-width="1.2" stroke-dasharray="3 3" opacity=".6"/>
      <rect y="203" width="900" height="37" :fill="`url(#${id}-grain)`"/>
      <path d="M752 229q90-37 148-28V240H752Z" fill="#1c3031" />
      <path d="M762 235q59-25 133-27" fill="none" stroke="#b9976a" stroke-width="3" stroke-dasharray="10 7" opacity=".38" />
      <!-- El logo es el punto de salida; el camión lleva el nombre como carga. -->
      <g class="journey-portal">
        <circle cx="72" cy="125" r="47" fill="#10202b" stroke="#ef9a48" stroke-width="1" opacity=".8" />
        <circle class="journey-logo-ring" cx="72" cy="125" r="44" fill="none" stroke="#ffb35d" stroke-width="2" stroke-dasharray="32 16" />
        <image :href="appIcon" x="39" y="92" width="66" height="66" />
      </g>
      <g class="journey-convoy">
        <JourneyVehicle kind="expedition" :decal="appEmblem" label="SnowRunner Studio"/>
        <g transform="translate(25,76)" data-emitter="rear-contact">
          <g class="journey-spray journey-spray--snow"><TerrainParticles material="snow" kind="spray"/></g>
          <g class="journey-spray journey-spray--dust"><TerrainParticles material="dust" kind="cloud" :count="9"/></g>
          <g class="journey-spray journey-spray--mud"><TerrainParticles material="mud" kind="spray" :count="18"/></g>
        </g>
        <g transform="translate(177,76)" data-emitter="front-contact">
          <g class="journey-spray journey-spray--mud"><TerrainParticles material="mud" kind="spray" :count="10"/></g>
        </g>
      </g>
      <g class="journey-snow" fill="#dce8e2" opacity=".6">
        <circle v-for="x of [32, 116, 187, 265, 368, 436, 583, 658, 740, 816, 866]" :key="x" :cx="x" :cy="(x * 7) % 130 + 15" r="1.5" />
      </g>
      <path d="M0 239H900" stroke="#ecb774" stroke-opacity=".35" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import JourneyVehicle from './journey-vehicle.vue'
import TerrainParticles from './terrain-particles.vue'
defineProps<{ loop?: boolean }>()
const id = useId().replace(/:/g, '')
const appIcon = new URL('../../images/app-icon.png', import.meta.url).href
const appEmblem = new URL('../../images/app-emblem.png', import.meta.url).href
</script>

<style scoped>
.startup-journey { --journey-time:9s;--journey-repeat:1;width: 100%; overflow: hidden; border-radius: 18px; isolation: isolate; background: #13242e; }
.startup-journey--loop { --journey-time:12s;--journey-repeat:infinite; }
svg { display: block; width: 100%; height: auto; }
.journey-convoy { transform-origin: 0 0; animation: journey-drive var(--journey-time) linear var(--journey-repeat) both; }
.journey-convoy :deep(.machine-body) { animation:journey-suspension var(--journey-time) linear var(--journey-repeat) both; }
.journey-convoy :deep(.rolling-wheel) { animation:journey-wheels var(--journey-time) linear var(--journey-repeat) both; }
.journey-portal { animation: journey-launch 3s ease-out both; }
.journey-logo-ring { transform-origin: 72px 125px; animation: journey-roll 6s linear infinite; }
.journey-spray { opacity:0;animation-duration:var(--journey-time);animation-timing-function:linear;animation-iteration-count:var(--journey-repeat);animation-fill-mode:both; }
.journey-spray--snow { animation-name:snow-contact; }
.journey-spray--dust { animation-name:rock-contact; }
.journey-spray--mud { animation-name:mud-contact; }
.journey-snow { animation: journey-snow 7s linear infinite; }
.journey-mud { animation: journey-water 4s ease-in-out infinite alternate; }
@keyframes journey-drive {
  0% { opacity: 0; transform: translate(64px, 143px) scale(.04); }
  8% { opacity: 1; transform: translate(74px, 135px) scale(.38); }
  18% { transform: translate(150px, 111px) scale(1); }
  35% { transform: translate(265px, 104px) rotate(-7deg); }
  46% { transform: translate(342px, 91px) rotate(4deg); }
  60% { transform: translate(460px, 118px) rotate(1deg); }
  76% { transform: translate(586px, 129px) rotate(-2deg); }
  90%, 100% { opacity: 1; transform: translate(637px, 129px); }
}
@keyframes journey-roll { to { transform: rotate(360deg); } }
@keyframes journey-wheels { 0% { transform:rotate(0); } 18% { transform:rotate(160deg); } 35% { transform:rotate(573deg); } 46% { transform:rotate(850deg); } 60% { transform:rotate(1272deg); } 76% { transform:rotate(1723deg); } 90%,100% { transform:rotate(1906deg); } }
@keyframes journey-suspension { 0%,18%,24%,33%,41%,50%,58%,66%,75%,84%,90%,100% { transform:translateY(0); } 21%,28%,37%,45%,54% { transform:translateY(-1.4px) rotate(-.35deg); } 62%,71%,79%,87% { transform:translateY(.6px); } }
@keyframes snow-contact { 0%,9% { opacity:0; } 12%,24% { opacity:1; } 28%,100% { opacity:0; } }
@keyframes rock-contact { 0%,27% { opacity:0; } 31%,52% { opacity:.7; } 58%,100% { opacity:0; } }
@keyframes mud-contact { 0%,55% { opacity:0; } 60%,85% { opacity:1; } 90%,100% { opacity:0; } }
@keyframes journey-launch { 30% { filter: drop-shadow(0 0 14px #ffab53); } 100% { opacity: .75; } }
@keyframes journey-snow { from { transform: translateY(-8px); } to { transform: translate(16px, 14px); } }
@keyframes journey-water { to { opacity: .45; } }
@media (prefers-reduced-motion: reduce) {
  .startup-journey :deep(*) { animation: none !important; }
  .journey-convoy { opacity:1;transform: translate(637px, 129px); }
  .journey-spray { opacity: 0; }
}
</style>
