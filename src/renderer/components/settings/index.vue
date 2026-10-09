<template>
  <Modal
    v-model:open="isOpen"
    width="520px"
    :title="texts.title"
  >
    <div class="settings">
	  <section class="settings-section">
	    <Language />
	  </section>
		
      <section class="settings-section checkboxes">
        <BoolSetting
          v-model="mods"
          :label="texts.modsLabel"
        />
        <BoolSetting
          v-model="advanced"
          :label="texts.advancedModeLabel"
        />
      </section>
      <section class="settings-section">
        <Button data-update-settings @click="emit('updates')">{{ updateTexts.updatesTitle }}</Button>
        <p>{{ updateTexts.updatesOptional }}</p>
      </section>
    </div>

    <template #footer>
      <Button
        key="submit"
        type="primary"
        @click="isOpen = false"
      >
        Ok
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { Language } from '@renderer/components/language'
import { di } from '@utilities/di/container.js'
import { CONFIG_TOKEN } from '@utilities/di/renderer/tokens.js'
import { Button, Modal } from 'ant-design-vue'
import { ref, watch } from 'vue'
import BoolSetting from './bool-setting.vue'
import { SETTINGS_LOCALIZATION as texts } from './localization.js'
import { UPDATE_LOCALIZATION as updateTexts } from '@renderer/pages/general/update/localization'

const config = di.resolve(CONFIG_TOKEN)
const mods = ref(config.useMods)
const advanced = ref(config.advancedMode)
const emit = defineEmits<{ updates: [] }>()

watch(mods, () => config.useMods = mods.value)
watch(advanced, () => config.advancedMode = advanced.value)

/** Открыты ли настройки. */
const isOpen = defineModel<boolean>({ required: true })
</script>

<style lang='scss' scoped>
.settings {
	display: grid;
	gap: 14px;
	padding: 8px 2px;

	.settings-section {
		padding: 16px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
	}

	.checkboxes {
		display: grid;
		gap: 12px;
	}
}
</style>
