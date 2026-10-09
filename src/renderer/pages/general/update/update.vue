<template>
  <ManualUpdatePanel v-model:open="isOpen" :current-version="config.version" :t="translate" :api="api" />
</template>

<script setup lang="ts">
import ManualUpdatePanel from '@renderer/components/manual-update-panel.vue'
import { di } from '@utilities/di/container'
import { CONFIG_TOKEN, UPDATES_TOKEN } from '@utilities/di/renderer/tokens'
import { UPDATE_LOCALIZATION as texts } from './localization'

const isOpen = defineModel<boolean>('open', { required: true })
const config = di.resolve(CONFIG_TOKEN)
const updates = di.resolve(UPDATES_TOKEN)
const translate = (key: string) => texts[key] ?? key
const api = {
	check: () => updates.checkUpdates(),
	download: () => updates.openUpdateDownload(),
	release: () => updates.openUpdateRelease()
}
</script>
