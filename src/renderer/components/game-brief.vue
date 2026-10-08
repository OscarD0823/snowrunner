<template>
  <div class="workspace-identity" data-workspace-identity="snowrunner">
    <span class="workspace-identity__tagline" :title="texts.help">{{ texts.title }}</span>
    <StartupJourney loop class="workspace-journey" />
  </div>
</template>
<script setup lang="ts">
import { loadLocalization, Localization, LocalizationStrings } from '@localization/renderer'
import StartupJourney from './startup-journey.vue'
const texts = loadLocalization(new Localization({
  title: new LocalizationStrings().es('Cada terreno, un nuevo desafío.').en('Every terrain, a new challenge.'),
  help: new LocalizationStrings().es('Explora rutas difíciles, prepara tu camión y lleva la carga a su destino. Potencia, agarre y recuperación trabajan juntos.').en('Explore difficult routes, prepare your truck and deliver the cargo. Power, grip and recovery work together.')
}))
</script>
