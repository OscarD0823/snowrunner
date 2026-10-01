<template>
  <div
    v-if="files"
    ref="container"
    class="list"
    :class="{ 'list--rows': listMode === ListMode.list }"
  >
    <div class="list-summary">
      <strong>{{ files[source].length }} {{ texts.resultCount }}</strong>
      <span><InfoCircleOutlined /> {{ texts.openHint }}</span>
    </div>
    <div
      v-if="source === SourceType.mods"
      class="mods-button-cont"
    >
      <Button
        type="primary"
        class="mods-button"
        @click="isShowMods = true"
      >
        {{ texts.modsChangeButton }}
      </Button>
    </div>
    <ModsPopup
      :show="isShowMods"
      @hide="hideModsPopup"
    />
    <Empty
      v-if="files[source].length === 0"
      class="empty-state"
      :description="texts.emptyList"
    />
    <component
      :is="isComponentCategory(item.category) ? ComponentItem : ListItem"
      v-for="item of listItems"
      :key="item.file.path"
      :file="item.file"
      :category="item.category"
      :style="{ display: files[source].includes(item.file) ? 'block' : 'none' }"
    />
  </div>
  <Spin
    v-else
    center
  />
</template>

<script lang='ts' setup>
import { InfoCircleOutlined } from '@ant-design/icons-vue'
import Spin from '@renderer/components/spin.vue'
import { di } from '@utilities/di/container'
import { APP_TOKEN } from '@utilities/di/renderer/tokens'
import { Button, Empty, Modal } from 'ant-design-vue'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'
import { ListMode, SourceType, isComponentCategory } from '../../../enums'
import { useListStore } from '../../../store/list'
import { LISTS_LOCALIZATION as texts } from '../../localization'
import ModsPopup from '../mods-popup.vue'
import ListItem from './item.vue'
import ComponentItem from './component-item.vue'

const { category, source, files, listMode } = storeToRefs(useListStore())
const isShowMods = ref(false)
const container = ref<HTMLDivElement | null>(null)
const listItems = getItems()

useScrollResetting()

function hideModsPopup(isReload?: boolean) {
	isShowMods.value = false

	if (isReload) {
		const app = di.resolve(APP_TOKEN)

		setTimeout(() => {
			Modal.confirm({
				okText: texts.ok, cancelText: texts.cancel,
				title: texts.relaunchPrompt,
				onOk: () => app.reload()
			})
		}, 200)
	}
}

function getItems() {
	return computed(() => files.value[SourceType.all].map(file => ({ file, category: category.value })))
}

function useScrollResetting() {
	watch(files, async () => {
		await nextTick()
		container.value?.scrollTo({ top: 0 })
	})
}
</script>

<style lang='scss' scoped>
.list {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
	overflow-y: auto;
	height: 100%;
	align-content: flex-start;
	flex-grow: 1;
	will-change: auto;
	gap: 16px;
	padding: 18px 20px 28px;
	box-sizing: border-box;
	background: var(--sr-bg);
}

.list--rows {
	display: block;

	.list-summary {
		margin-bottom: 14px;
	}

	:deep(.card-container) {
		width: 100%;
		margin-bottom: 10px;
	}
}

.list-summary {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	grid-column: 1 / -1;
	color: #64748b;
	font-size: 12px;

	strong {
		color: #334155;
		font-size: 13px;
	}

	span {
		display: flex;
		align-items: center;
		gap: 6px;
	}
}

.mods-button-cont {
	grid-column: 1 / -1;
	text-align: center;
}

.mods-button {
	margin-bottom: 10px;

	&-cont {
		width: 100%;
		text-align: center;
	}
}

.empty-state {
	display: grid;
	place-items: center;
	width: 100%;
	grid-column: 1 / -1;
	min-height: 240px;
}

@media (max-width: 700px) {
	.list {
		grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
		gap: 10px;
		padding: 12px;
	}

	.list-summary {
		align-items: flex-start;
		flex-direction: column;
		gap: 4px;

		span {
			display: none;
		}
	}
}
</style>
