<template>
  <div
    ref="contextTarget"
    class="grid parameter"
  >
    <ContextMenu
      :items="contextItems"
      :target="contextTarget"
    />
    <div class="label">
      <Wrap
        :wrapper="popover"
        :wrap="!!descRef && ![Lang.ch, Lang.zhTw].includes(config.lang)"
      >
        <template #content>
          <Text>{{ descRef }}</Text>
        </template>
        <Text>{{ labelRef }}</Text>
      </Wrap>
      <p v-if="descRef" class="parameter-help">{{ descRef }}</p>
    </div>
    <div
      v-if="isActive"
      class="content"
    >
      <slot
        :value="value"
        :on-change="changeValue"
      />
      <div
        v-if="originalValue !== undefined"
        class="value-guide"
      >
        <div class="original-value">
          <span>{{ texts.originalValue }}</span>
          <strong>{{ originalValue }}</strong>
        </div>
        <div
          v-if="recommendations.length"
          class="recommendations"
        >
          <span class="recommendations-title">{{ texts.safeRecommendations }}</span>
          <Button
            v-for="recommendation of recommendations"
            :key="recommendation.level"
            size="small"
            :title="texts.safeRecommendationHint"
            @click="changeValue(recommendation.value)"
          >
            {{ recommendationLabel(recommendation.level) }} · {{ recommendation.value }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang='ts' setup>
import { Lang } from '@modules/data/config/enums'
import type { IExportedData } from '@modules/epf/types'
import type { Limit } from '@modules/xml/renderer'
import ContextMenu from '@renderer/components/context-menu.vue'
import Wrap from '@renderer/components/wrap.vue'
import type { EmitsToProps } from '@renderer/types'
import { isNullable, isString } from '@utilities/checks/renderer'
import { di } from '@utilities/di/container'
import { CONFIG_TOKEN } from '@utilities/di/renderer/tokens'
import { Button, Popover, Typography } from 'ant-design-vue'
import { storeToRefs } from 'pinia'
import { computed, h, onMounted, ref, toRefs } from 'vue'
import { useEditorStore } from '../../store/editor'
import { EDITOR_LOCALIZATION as texts } from '../localization'
import type { IParameterProps, ParameterEmits, ParameterValue } from '../types'
import { exportUtils } from '../utilities/export'
import { importUtils, injectFile } from '../utilities/import'
import { resetUtils } from '../utilities/reset'
import { getSafeRecommendations, type RecommendationLevel } from '../utilities/recommendations'
import { useActive } from './utilities'

const { Text } = Typography
const popover = h(Popover, { placement: 'topLeft' })

export type ParameterProps = IParameterProps & EmitsToProps<ParameterEmits>

const config = di.resolve(CONFIG_TOKEN)
const props = defineProps<IParameterProps>()
const { label, desc, descriptor } = toRefs(props)
const emit = defineEmits<ParameterEmits>()

defineSlots<{
	default(props: { value: ParameterValue; onChange(v: ParameterValue): void }): any
}>()

const labelRef = computed(() => label.value ?? descriptor.value.label)
const descRef = computed(() => desc.value ?? descriptor.value.desc)
const { info } = storeToRefs(useEditorStore())
const file = injectFile()

const { isActive } = useActive()

const getValue = props.getter ?? descriptor.value.get
const setValue = (value: ParameterValue) => {
	if (isString(value)) {
		descriptor.value.setStr(value)
	} else {
		(props.setter ?? descriptor.value.set)(value)
	}

	emit('change', getValue())
}

const value = ref(getValue() ?? '')
const originalValue = ref<number>()
const recommendations = computed(() => originalValue.value === undefined
	? []
	: getSafeRecommendations(
		descriptor.value.name,
		originalValue.value,
		descriptor.value.step,
		descriptor.value.limit as Limit | undefined,
		descriptor.value.areas
	)
)

onMounted(loadOriginalValue)

resetUtils.onReset(resetValue)
importUtils.onImport(data => {
	const exportedValue = getExportedValue(data.data)

	if (isNullable(exportedValue)) {
		return
	}

	changeValue(exportedValue)
})
exportUtils.onExport(data => {
	const fileName = exportUtils.getName(file, info.value.dlc, info.value.mod)
	const fileData = data.data[fileName] ??= {}
	const selectorData = fileData[descriptor.value.selector] ??= {}

	selectorData[descriptor.value.name] = descriptor.value.getStr() ?? descriptor.value.get()
})

const contextTarget = ref<HTMLDivElement | null>(null)
const contextItems = [{
	key: 'reset-param',
	label: `${texts.resetMenuItemLabel} "${labelRef.value}"`,
	onClick: resetValue
}]

async function resetValue() {
	const defaultVal = await getDefaultValue()

	if (defaultVal === undefined) {
		return
	}

	changeValue(defaultVal)
}

function changeValue(newValue: ParameterValue) {
	if (value.value === newValue) {
		return
	}
	
	setValue(newValue)
	value.value = getValue()
}

async function getDefaultValue() {
	return resetUtils.getDefaultValue(file, info.value, descriptor.value)
}

async function loadOriginalValue() {
	if (!('attrType' in descriptor.value) || descriptor.value.attrType !== 'number') {
		return
	}

	const savedDefault = await getDefaultValue()
	const candidate = savedDefault ?? getValue()
	const parsed = Number(candidate)

	if (Number.isFinite(parsed)) {
		originalValue.value = parsed
	}
}

function recommendationLabel(level: RecommendationLevel) {
	return {
		low: texts.recommendationLow,
		medium: texts.recommendationMedium,
		high: texts.recommendationHigh
	}[level]
}

function getExportedValue(data: IExportedData['data']): string | number | undefined {
	const name = importUtils.getName(file, info.value.dlc, info.value.mod)
	
	return data[name]
		?.[descriptor.value.selector]
		?.[descriptor.value.name]
}
</script>

<style lang="scss">
$parameterMinWidth: 650px;
$parameterMinWidthAddition: calc($parameterMinWidth / 10);

.table .ant-collapse-content .ant-collapse-content-box {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	align-content: flex-start;
	justify-content: center;
	align-items: center;
	row-gap: 10px;
	padding: 10px !important;

	@media screen and (min-width: calc($parameterMinWidth * 2 + $parameterMinWidthAddition)) {
		> div:nth-last-child(1 of .grid) {
			flex: 0 0 auto;
		}
	}
}

@media screen and (min-width: calc($parameterMinWidth * 2 + $parameterMinWidthAddition)) {
	.table .ant-collapse-content .ant-collapse-content-box {
		justify-content: space-between;
	}
}

@media screen and (max-width: 760px) {
	.parameter {
		min-width: 100%;
		padding: 8px 4px;
		align-items: stretch;
		flex-direction: column;
		gap: 8px;

		.label,
		.content {
			width: 100%;
		}

		.label {
			padding-left: 0;
			font-weight: 650;
		}

		.content {
			align-items: stretch;
			justify-content: flex-start;
			text-align: left;
		}

		.value-guide {
			align-items: flex-start;

			.recommendations {
				justify-content: flex-start;
			}
		}
	}
}
</style>

<style lang='scss' scoped>
$parameterMinWidth: 650px;
$parameterMinWidthAddition: calc($parameterMinWidth / 10);

.desc-image img {
	max-width: 600px;
	max-height: 500px;
}

.parameter {
	flex-wrap: nowrap;
	box-sizing: border-box;
	align-content: center;
	justify-content: space-between;
	align-items: center;
	flex: 1 1 0;
	min-width: $parameterMinWidth;
	min-height: 40px;

	.label,
	.content {
		box-sizing: border-box;
		width: 50%;
	}

	.label {
		padding-left: 30px;
	}

	.parameter-help {
		margin: 5px 14px 0 0;
		color: #64748b;
		font-size: 11px;
		line-height: 1.5;
	}

	.content {
		display: flex;
		text-align: center;
		flex-wrap: wrap;
		align-content: center;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	.value-guide {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 6px;
		width: 100%;
		padding: 7px 9px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-size: 11px;

		.original-value {
			display: flex;
			gap: 6px;
			color: #64748b;

			strong {
				color: #334155;
			}
		}

		.recommendations {
			display: flex;
			flex-wrap: wrap;
			justify-content: flex-end;
			gap: 5px;

			&-title {
				align-self: center;
				color: #15803d;
				font-weight: 650;
			}

			:deep(.ant-btn) {
				color: #166534;
				border-color: #bbf7d0;
				background: #f0fdf4;
			}
		}
	}

	@media screen and (min-width: calc($parameterMinWidth * 2 + $parameterMinWidthAddition)) {
		.content {
			justify-content: flex-end;
			padding-right: 40px;
		}
	}
}

@media screen and (min-width: calc($parameterMinWidth * 2 + $parameterMinWidthAddition)) {
	.parameter {
		width: 50%;
		min-width: 50%;

		&:nth-child(2n+1) {
			border-right: 1px solid lightgray;
		}

		&:nth-child(2n) {
			flex: 1 1 0 !important;
		}
	}
}
</style>
