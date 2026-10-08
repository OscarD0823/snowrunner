<template>
  <section class="game-brief" data-game-brief="snowrunner" :aria-label="texts.title">
    <div class="game-brief__copy">
      <span class="eyebrow">{{ texts.label }}</span>
      <h2>{{ texts.title }}</h2>
      <p>{{ texts.help }}</p>
      <ol class="operation-route" :aria-label="texts.flow">
        <li v-for="(step, index) in [texts.explore, texts.prepare, texts.deliver]" :key="step"><b>{{ String(index + 1).padStart(2, '0') }}</b>{{ step }}</li>
      </ol>
    </div>
    <div class="game-brief__scene"><StartupJourney loop class="library-journey" /><span>{{ texts.scene }}</span></div>
  </section>
</template>
<script setup lang="ts">
import { loadLocalization, Localization, LocalizationStrings } from '@localization/renderer'
import StartupJourney from './startup-journey.vue'
const texts = loadLocalization(new Localization({
  label: new LocalizationStrings().es('SNOWRUNNER · TALLER DE EXPEDICIÓN').en('SNOWRUNNER · EXPEDITION WORKSHOP'),
  title: new LocalizationStrings().es('Cada terreno, un nuevo desafío.').en('Every terrain, a new challenge.'),
  help: new LocalizationStrings().es('Explora rutas difíciles, prepara tu camión y lleva la carga a su destino. Potencia, agarre y recuperación trabajan juntos.').en('Explore difficult routes, prepare your truck and deliver the cargo. Power, grip and recovery work together.'),
  flow: new LocalizationStrings().es('Objetivos del juego, no progreso real de contratos').en('Game objectives, not live contract progress'),
  explore: new LocalizationStrings().es('Explorar la ruta').en('Explore the route'),
  prepare: new LocalizationStrings().es('Preparar la flota').en('Prepare the fleet'),
  deliver: new LocalizationStrings().es('Entregar la carga').en('Deliver the cargo'),
  scene: new LocalizationStrings().es('Ruta ilustrada · barro, roca y nieve').en('Illustrated route · mud, rock and snow')
}))
</script>
