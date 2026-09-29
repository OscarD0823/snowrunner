<template>
  <Alert
    v-if="isOpen"
    class="alert"
    :message="texts.title"
    :description="`${texts.allowNewVersion} (v${version})`"
    type="info"
    show-icon
    closable
  >
    <template #icon>
      <CloudDownloadOutlined />
    </template>
    <template #action>
      <Space
        direction="vertical"
        class="buttons"
      >
        <Button
          size="small"
          type="primary"
          @click="onUpdateClick"
        >
          {{ texts.update }}
        </Button>
        <Button
          size="small"
          type="primary"
          danger
          @click="onIgnoreClick"
        >
          {{ texts.ignore }}
        </Button>
      </Space>
    </template>
  </Alert>
</template>

<script lang='ts' setup>
import { CloudDownloadOutlined } from '@ant-design/icons-vue'
import { di } from '@utilities/di/container'
import { CHECKS_TOKEN, CONFIG_TOKEN, UPDATES_TOKEN } from '@utilities/di/renderer/tokens'
import type { ButtonProps } from 'ant-design-vue'
import { Alert, Button, Space } from 'ant-design-vue'
import { onMounted, ref } from 'vue'
import { UPDATE_LOCALIZATION as texts } from './localization'

const checks = di.resolve(CHECKS_TOKEN)

const version = ref('')
const isOpen = ref(false)

onMounted(async () => {
	version.value = await checks.checkUpdate() ?? ''
	isOpen.value = !!version.value
})

const onUpdateClick: ButtonProps['onClick'] = () => {
	if (!version.value) {
		return
	}

	const updates = di.resolve(UPDATES_TOKEN)
	
	void updates.updateApp(version.value)
	isOpen.value = false
}

const onIgnoreClick: ButtonProps['onClick'] = () => {
	const config = di.resolve(CONFIG_TOKEN)

	config.checkUpdates = false
	isOpen.value = false
}
</script>

<style lang='scss' scoped>
.alert {
	position: absolute;
	bottom: 0;
	right: 0;
	height: fit-content;
	width: 400px;
	z-index: 5;

	.buttons {
		margin-left: 10px;
	}
}
</style>
