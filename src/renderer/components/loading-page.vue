<template>
  <div
    v-if="loading.state.isLoading"
    class="loading-screen"
    data-loading-screen
  >
    <main class="splash" aria-label="SnowRunner Studio" aria-busy="true">
      <header class="splash__brand">
        <img :src="appIcon" alt="">
        <div>
          <strong>SnowRunner Studio</strong>
          <span>{{ texts.expedition }}</span>
        </div>
      </header>
      <StartupJourney class="loading-journey" loop />
      <div class="loading-details">
        <p class="title" role="status" aria-live="polite">
          {{ loadingText }}
        </p>
        <AntProgress
          v-if="loading.state.stagesCount !== 1"
          class="progress"
          type="line"
          :percent="loading.percent.value"
          :status="progressStatus"
          :show-info="progressStatus !== 'success'"
          stroke-color="#7adbd2"
          trail-color="rgba(255, 255, 255, 0.12)"
        />
        <div v-else class="activity-dots" aria-hidden="true">
          <i /><i /><i />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { loadLocalization, Localization, LocalizationStrings } from '@localization/renderer'
import { di } from '@utilities/di/container'
import { LOADING_TOKEN, MESSAGES_TOKEN } from '@utilities/di/renderer/tokens'
import type { ProgressProps } from 'ant-design-vue'
import { Progress as AntProgress } from 'ant-design-vue'
import { computed } from 'vue'
import StartupJourney from './startup-journey.vue'

const loading = di.resolve(LOADING_TOKEN)
const messages = di.resolve(MESSAGES_TOKEN)
const appIcon = new URL('../../images/app-icon.svg', import.meta.url).href
const texts = loadLocalization(new Localization({
	preparing: new LocalizationStrings().es('Preparando el estudio…').en('Preparing the studio…'),
	expedition: new LocalizationStrings().es('Prepara tu próxima expedición').en('Prepare your next expedition')
}))

const loadingText = computed(() => {
	const text = loading.state.text
	return !text || text === 'Loading' ? texts.preparing : text
})

const progressStatus = computed<ProgressProps['status']>(() => {
	if (loading.state.hasError) {
		messages.error(loading.state.error)
		return 'exception'
	}
	if (loading.state.completedCount >= loading.state.stagesCount) {
		return 'success'
	}
	return 'active'
})
</script>

<style lang="scss" scoped>
// Do not use "wrapper": the console menu uses display: contents on that class.
.loading-screen {
	position: fixed;
	z-index: 1000;
	inset: 0;
	display: grid;
	align-items: safe center;
	justify-items: center;
	box-sizing: border-box;
	padding: clamp(12px, 3vw, 32px);
	overflow: auto;
	color: #ecf7fa;
	background:
		radial-gradient(ellipse at 50% 25%, #24516c70, transparent 65%),
		linear-gradient(145deg, #102b39, #08141e 70%);
}

.splash {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 18px;
	width: min(600px, 100%);
	min-width: 0;
	box-sizing: border-box;
	padding: clamp(16px, 3vw, 28px);
	border: 1px solid #38596a;
	border-radius: 20px;
	background: #102635e8;
	box-shadow: 0 20px 60px #0004;
	animation: splash-enter .5s ease-out both;

	&__brand {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;

		img { width: 44px; height: 44px; flex: 0 0 auto; border-radius: 12px; }
		div { min-width: 0; }
		strong { display: block; font-size: clamp(17px, 2.8vw, 22px); line-height: 1.25; }
		span { display: block; margin-top: 4px; color: #afcbd6; font-size: 12px; line-height: 1.4; }
	}
}

.loading-journey {
	width: 100%;
	min-width: 0;
	margin: 0;
	box-sizing: border-box;
	border: 1px solid #486778;
	border-radius: 12px;

	:deep(svg) { display: block; width: 100%; height: auto; }
}

.loading-details { min-width: 0; }
.title { margin: 0 0 12px; color: #c6dce5; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
.progress {
	width: 100%;
	margin: 0;
	:deep(.ant-progress-text) { color: #d7ecef; }
}
.activity-dots {
	display: flex;
	gap: 7px;
	min-height: 12px;
	align-items: center;
	i { width: 7px; height: 7px; border-radius: 50%; background: #7adbd2; animation: dot-pulse 1s ease-in-out infinite; }
	i:nth-child(2) { animation-delay: .14s; }
	i:nth-child(3) { animation-delay: .28s; }
}

@keyframes splash-enter { from { opacity: 0; transform: translateY(8px); } }
@keyframes dot-pulse { 0%, 100% { opacity: .3; } 50% { opacity: 1; } }

@media (max-height: 480px) {
	.splash { width: min(480px, 100%); gap: 12px; padding: 16px; }
	.splash__brand img { width: 36px; height: 36px; }
	.splash__brand span { font-size: 11px; }
}
@media (prefers-reduced-motion: reduce) {
	.loading-screen *, .loading-screen *::before, .loading-screen *::after { animation: none !important; }
}
</style>
