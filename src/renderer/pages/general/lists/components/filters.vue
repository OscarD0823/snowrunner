<template>
  <VueTransition name="filters">
    <div
      v-show="isOpen"
      class="filters"
    >
      <label
        v-if="category === Category.trucks"
        class="filter-field"
      >
        <span>{{ texts.typeFilter }}</span>
        <Select
          class="filter-select"
          size="large"
          :disabled="category !== Category.trucks"
          :options="truckTypes"
          :value="truckType"
          @change="setTruckType($event as TruckType)"
        />
      </label>
      <label class="filter-field search-field">
        <span>{{ texts.searchFilter }}</span>
        <Input
          class="filter-input"
          size="large"
          allow-clear
          :placeholder="texts.searchPlaceholder"
          :value="name"
          @change="setName($event.target.value)"
        >
          <template #prefix>
            <SearchOutlined />
          </template>
        </Input>
      </label>
    </div>
  </VueTransition>
</template>

<script setup lang="ts">
import { SearchOutlined } from '@ant-design/icons-vue'
import { TruckType } from '@modules/xml/renderer'
import type { SelectProps } from 'ant-design-vue'
import { Input, Select } from 'ant-design-vue'
import { storeToRefs } from 'pinia'
import { computed, Transition as VueTransition } from 'vue'
import { Category } from '../../enums'
import { useListStore } from '../../store/list'
import { LISTS_LOCALIZATION as texts } from '../localization'

export type FiltersProps = {
	isOpen: boolean
}

defineProps<FiltersProps>()

const listStore = useListStore()
const { category, name, truckType } = storeToRefs(listStore)
const { setName, setTruckType } = listStore
const truckTypes = computed<SelectProps['options']>(() => [
	{
		label: texts.allTypes,
		value: ''
	},
	{
		label: texts.HEAVY_TYPE,
		value: TruckType.heavy
	},
	{
		label: texts.HEAVY_DUTY_TYPE,
		value: TruckType.heavyDuty
	},
	{
		label: texts.HIGHWAY_TYPE,
		value: TruckType.highway
	},
	{
		label: texts.OFFROAD_TYPE,
		value: TruckType.offroad
	},
	{
		label: texts.SCOUT_TYPE,
		value: TruckType.scout
	}
])
</script>

<style lang="scss">
.filters-enter-active,
.filters-leave-active {
	transition: all 0.1s ease-out;
}

.filters-enter-from,
.filters-leave-to {
	transform: translateY(-50px);
}
</style>

<style lang="scss" scoped>
.filters {
	display: grid;
	grid-template-columns: minmax(180px, 0.65fr) minmax(260px, 1.35fr);
	gap: 14px;
	background: #ffffff;
	border-bottom: 1px solid var(--sr-border);
	padding: 14px 20px 16px;
	z-index: 0;

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
		color: #64748b;
		font-size: 11px;
		font-weight: 650;
		letter-spacing: 0.04em;
		text-align: left;
		text-transform: uppercase;
	}

	.filter-select,
	.filter-input {
		width: 100%;
		font-size: 14px;
		font-weight: 400;
		text-transform: none;
	}

	.search-field:last-child {
		grid-column: -2 / -1;
	}

	.search-field:only-child {
		grid-column: 1 / -1;
	}

	:deep(.ant-select-selector),
	:deep(.ant-input-affix-wrapper) {
		border-radius: 9px !important;
		border-color: #dbe3ec !important;
		box-shadow: none !important;
	}

	@media (max-width: 900px) {
		grid-template-columns: minmax(150px, 0.7fr) minmax(210px, 1.3fr);
	}

	@media (max-width: 620px) {
		grid-template-columns: 1fr;
		gap: 9px;
		padding: 10px 12px 12px;

		.search-field:last-child {
			grid-column: auto;
		}
	}
}
</style>
