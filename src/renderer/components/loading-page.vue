<template>
  <div
    v-if="loading.state.isLoading"
    class="wrapper"
  >
    <div class="ambient ambient--one" />
    <div class="ambient ambient--two" />
    <main
      class="splash"
      aria-live="polite"
    >
      <div class="brand">
        <span>SnowRunner</span>
        <strong>Studio</strong>
      </div>
      <StartupJourney class="loading-journey" loop />
      <Title
        class="title"
        :level="4"
      >
        {{ loading.state.text || 'Preparando el estudio…' }}
      </Title>
      <AntProgress
        v-if="loading.state.stagesCount !== 1"
        class="progress"
        type="line"
        :percent="loading.percent.value"
        :status="progressStatus"
        :show-info="progressStatus !== 'success'"
        stroke-color="#f97316"
        trail-color="rgba(255, 255, 255, 0.12)"
      />
      <div
        v-else
        class="activity-dots"
        aria-label="Cargando"
      >
        <i /><i /><i />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { di } from '@utilities/di/container'
import { LOADING_TOKEN, MESSAGES_TOKEN } from '@utilities/di/renderer/tokens'
import type { ProgressProps } from 'ant-design-vue'
import { Progress as AntProgress, Typography } from 'ant-design-vue'
import { computed } from 'vue'
import StartupJourney from './startup-journey.vue'

const loading = di.resolve(LOADING_TOKEN)
const messages = di.resolve(MESSAGES_TOKEN)

const { Title } = Typography

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

<style lang='scss' scoped>
.wrapper {
	display: grid;
	position: fixed;
	z-index: 1000;
	inset: 0;
	place-items: center;
	color: white;
	background:
		radial-gradient(circle at 50% 34%, rgba(30, 64, 175, 0.3), transparent 34%),
		linear-gradient(145deg, #172554 0%, #0f172a 46%, #050a12 100%);
	overflow: hidden;

	&::after {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
		background-size: 32px 32px;
		content: '';
		mask-image: linear-gradient(to bottom, transparent, black 45%, transparent);
	}

	.ambient {
		position: absolute;
		width: 38vw;
		height: 38vw;
		border-radius: 50%;
		filter: blur(75px);
		opacity: 0.22;
		animation: ambient-float 6s ease-in-out infinite alternate;

		&--one { top: -20%; left: -8%; background: #f97316; }
		&--two { right: -12%; bottom: -24%; background: #2563eb; animation-delay: -3s; }
	}

	.splash {
		position: relative;
		z-index: 2;
		width: min(760px, calc(100vw - 48px));
		text-align: center;
		animation: splash-enter 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.logo-orbit {
		display: grid;
		position: relative;
		width: 92px;
		height: 92px;
		margin: 0 auto 16px;
		place-items: center;

		img {
			width: 68px;
			height: 68px;
			border-radius: 18px;
			box-shadow: 0 16px 34px rgba(0, 0, 0, 0.34);
		}

		&__ring {
			position: absolute;
			inset: 0;
			border: 2px solid rgba(251, 146, 60, 0.18);
			border-top-color: #fb923c;
			border-right-color: rgba(251, 146, 60, 0.6);
			border-radius: 50%;
			animation: orbit 2.4s linear infinite;
		}
	}

	.brand {
		display: flex;
		justify-content: center;
		gap: 7px;
		font-size: 22px;
		letter-spacing: 0.02em;

		span { font-weight: 350; color: #cbd5e1; }
		strong { font-weight: 750; }
	}
	.loading-journey { margin: 22px 0; box-shadow: 0 18px 45px #0006; border: 1px solid #d9bd8733; }

	.terrain {
		position: relative;
		height: 92px;
		margin: 20px 0 10px;
		overflow: hidden;
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);

		&__ridge {
			position: absolute;
			bottom: -47px;
			left: -10%;
			width: 120%;
			height: 85px;
			background: #1e293b;
			border-radius: 48% 52% 0 0;
			transform: rotate(-2deg);

			&--back { bottom: -38px; background: #334155; opacity: 0.52; transform: rotate(3deg); }
		}
	}

	.vehicle {
		position: absolute;
		z-index: 3;
		left: calc(50% - 48px);
		bottom: 27px;
		width: 96px;
		height: 42px;
		animation: vehicle-drive 2.8s ease-in-out infinite;

		i { position: absolute; display: block; }
		&__cab { right: 5px; bottom: 9px; width: 34px; height: 27px; background: #f97316; border-radius: 7px 9px 3px 3px; transform: skew(-5deg); }
		&__bed { left: 7px; bottom: 9px; width: 54px; height: 21px; background: #fb923c; border-radius: 4px 2px 3px 3px; }
		&__wheel { bottom: 2px; width: 18px; height: 18px; background: #050a12; border: 4px solid #94a3b8; border-radius: 50%; animation: wheel-spin 0.65s linear infinite; }
		&__wheel--one { left: 18px; }
		&__wheel--two { right: 13px; }
	}

	.progress {
		width: 100%;
		margin-top: 2px;
		:deep(.ant-progress-text) { color: #cbd5e1; }
	}

	.title {
		width: 100%;
		min-height: 22px;
		margin: 0 0 12px;
		color: #cbd5e1;
		font-size: 13px;
		font-weight: 450;
		letter-spacing: 0.015em;
	}

	.activity-dots {
		display: flex;
		justify-content: center;
		gap: 7px;

		i {
			width: 7px;
			height: 7px;
			background: #fb923c;
			border-radius: 50%;
			animation: dot-pulse 1s ease-in-out infinite;
			&:nth-child(2) { animation-delay: 0.14s; }
			&:nth-child(3) { animation-delay: 0.28s; }
		}
	}
}

@keyframes splash-enter { from { opacity: 0; transform: translateY(14px) scale(0.98); } }
@keyframes orbit { to { transform: rotate(360deg); } }
@keyframes vehicle-drive { 0%, 100% { transform: translate(-15px, 1px) rotate(-1deg); } 50% { transform: translate(15px, -2px) rotate(1deg); } }
@keyframes wheel-spin { to { transform: rotate(360deg); } }
@keyframes dot-pulse { 0%, 100% { opacity: 0.25; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-4px); } }
@keyframes ambient-float { to { transform: translate(8%, 6%) scale(1.08); } }

@media (prefers-reduced-motion: reduce) {
	.wrapper * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
}
</style>
