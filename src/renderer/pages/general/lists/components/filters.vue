<template>
  <VueTransition name="filters">
    <div
      v-show="isOpen"
      class="filters"
    >
      <label class="filter-field">
        <span>{{ texts.categoryFilter }}</span>
        <Select
          class="filter-select"
          size="large"
          :options="categories"
          :value="category"
          @change="setCategory($event as Category)"
        />
      </label>
      <label class="filter-field">
        <span>{{ texts.sourceFilter }}</span>
        <Select
          class="filter-select"
          size="large"
          :options="sources"
          :value="source"
          @change="setSource($event as SourceType)"
        />
      </label>
      <label class="filter-field">
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
        />
      </label>
    </div>
  </VueTransition>
</template>

<script setup lang="ts">
import { TruckType } from '@modules/xml/renderer'
import { di } from '@utilities/di/container'
import { CONFIG_TOKEN } from '@utilities/di/renderer/tokens'
import type { SelectProps } from 'ant-design-vue'
import { Input, Select } from 'ant-design-vue'
import { storeToRefs } from 'pinia'
import { computed, Transition as VueTransition } from 'vue'
import { Category, SourceType } from '../../enums'
import { useListStore } from '../../store/list'
import { LISTS_LOCALIZATION as texts } from '../localization'

export type FiltersProps = {
	isOpen: boolean
}

defineProps<FiltersProps>()

const listStore = useListStore()
const { category, source, name, truckType } = storeToRefs(listStore)
const { setSource, setCategory, setName, setTruckType } = listStore

const categories = computed<SelectProps['options']>(() => [
	{
		label: texts.trucksCategory,
		value: Category.trucks
	},
	{
		label: texts.trailersCategory,
		value: Category.trailers
	}
])
const sources = computed<SelectProps['options']>(() => [
	{
		label: texts.allSource,
		value: SourceType.all
	},
	{
		label: texts.mainSource,
		value: SourceType.main
	},
	{
		label: texts.dlcSource,
		value: SourceType.dlc
	},
	{
		label: texts.modsSource,
		value: SourceType.mods,
		disabled: !di.resolve(CONFIG_TOKEN).useMods
	},
	{
		label: texts.favoritesSource,
		value: SourceType.favorites
	},
	{
		label: texts.editedSource,
		value: SourceType.edited
	}
])
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
	grid-template-columns: repeat(3, minmax(145px, 1fr)) minmax(190px, 1.35fr);
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

	:deep(.ant-select-selector),
	:deep(.ant-input-affix-wrapper) {
		border-radius: 9px !important;
		border-color: #dbe3ec !important;
		box-shadow: none !important;
	}

	@media (max-width: 900px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}
</style>
