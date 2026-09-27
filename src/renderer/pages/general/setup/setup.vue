<template>
  <div class="setup">
    <div class="setup-card">
      <div class="setup-brand">
        <span class="setup-mark">SR</span>
        <span>SnowRunner Studio</span>
      </div>
      <h1>{{ texts.welcomeTitle }}</h1>
      <p class="intro">
        {{ texts.welcomeDescription }}
      </p>

      <Steps
        class="steps"
        :current="step"
        :items="[
          { title: texts.languageLabel },
          { title: texts.gameDataStep }
        ]"
      />
      <div class="steps-content">
        <template v-if="step === 0">
          <h2>{{ texts.languageLabel }}</h2>
          <p>{{ texts.languageHelp }}</p>
          <Language radio-mode />
        </template>
        <template v-else-if="step === 1">
          <h2>{{ texts.gameFolderLabel }}</h2>
          <p>{{ texts.gameDataHelp }}</p>
          <InitialSelect @update:model-value="onChangeGameFolder" />
          <div class="safety-note">
            <SafetyCertificateOutlined />
            {{ texts.safetyNote }}
          </div>
        </template>
      </div>
      <div class="steps-actions">
        <Button
          v-if="step === 0"
          type="primary"
          size="large"
          @click="step++"
        >
          {{ texts.next }}
          <ArrowRightOutlined />
        </Button>
        <Button
          v-else
          size="large"
          @click="step--"
        >
          Volver
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang='ts' setup>
import type { IFile } from '@modules/files/renderer'
import { Page } from '@modules/windows/enums'
import { ArrowRightOutlined, SafetyCertificateOutlined } from '@ant-design/icons-vue'
import { Language } from '@renderer/components/language'
import { usePageStore } from '@renderer/pages/general/store/page'
import { di } from '@utilities/di/container'
import { ARCHIVER_TOKEN, BACKUP_TOKEN, CONFIG_MANAGER_TOKEN, CONFIG_TOKEN, DLC_TOKEN, GAME_TEXTS_TOKEN, MESSAGES_TOKEN, MODS_TOKEN } from '@utilities/di/renderer/tokens'
import { Button, Steps } from 'ant-design-vue'
import { ref } from 'vue'
import InitialSelect from './initial-select.vue'
import { SETUP_LOCALIZATION as texts } from './localization.js'

const step = ref(0)
const { route } = usePageStore()

async function onChangeGameFolder(file?: IFile) {
	if (!file) {
		return
	}

	const config = di.resolve(CONFIG_TOKEN)
	const configManager = di.resolve(CONFIG_MANAGER_TOKEN)
	const backup = di.resolve(BACKUP_TOKEN)
	const archiver = di.resolve(ARCHIVER_TOKEN)
	const dlc = di.resolve(DLC_TOKEN)
	const gameTexts = di.resolve(GAME_TEXTS_TOKEN)
	const mods = di.resolve(MODS_TOKEN)
	const messages = di.resolve(MESSAGES_TOKEN)
	config.initialPath = file.path

	try {
		await backup.save()
		await archiver.unpackMain()
		await gameTexts.initFromInitial()
		await dlc.init()
		await mods.procMods()
		await configManager.save()
		route(Page.lists)
	} catch (error: any) {
		config.initialPath = null
		await configManager.save()
		messages.error(error)
	}
}
</script>

<style lang='scss' scoped>
.setup {
	display: flex;
	width: 100%;
	height: 100%;
	justify-content: center;
	align-items: center;
	padding: 32px;
	background:
		radial-gradient(circle at 15% 15%, rgba(249, 115, 22, 0.16), transparent 32%),
		linear-gradient(145deg, #111827, #1e293b);

	&-card {
		box-sizing: border-box;
		width: min(760px, 92vw);
		padding: 38px 46px;
		background: white;
		border: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: 20px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
		text-align: center;
	}

	&-brand {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		color: #475569;
		font-weight: 650;
		font-size: 13px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	&-mark {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 9px;
		background: #ea580c;
		color: white;
		font-size: 11px;
	}

	h1 {
		margin: 22px 0 8px;
		color: #172033;
		font-size: 30px;
	}

	.intro {
		max-width: 590px;
		margin: 0 auto;
		color: #64748b;
		font-size: 15px;
		line-height: 1.55;
	}

	.steps {
		margin-top: 32px;
		padding: 0 8%;

		&-content,
		&-actions {
			width: 100%;
			margin-top: 26px;
		}
	}

	.steps-content {
		min-height: 180px;
		padding: 24px;
		box-sizing: border-box;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 14px;

		h2 {
			margin: 0 0 6px;
			font-size: 18px;
		}

		p {
			max-width: 560px;
			margin: 0 auto 24px;
			color: #64748b;
			line-height: 1.5;
		}
	}

	.safety-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 22px;
		color: #15803d;
		font-size: 13px;
	}
}
</style>
