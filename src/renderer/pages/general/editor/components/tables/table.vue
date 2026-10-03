<template>
  <div class="table">
    <Trailer
      v-if="xml.Type === TruckFileType.trailer || /[\\/]trucks[\\/]trailers[\\/]/i.test(file.path)"
      :xml="xml"
      :file="file"
      @ready="$emit('ready')"
    />
    <Truck
      v-else
      :xml="xml"
      :file="file"
      @ready="$emit('ready')"
      @preview-context="$emit('previewContext', $event)"
    />
  </div>
</template>

<script lang='ts' setup>
import type { IFile } from '@modules/files/types'
import { TruckFileType, type TruckXML } from '@modules/xml/renderer'
import type { VehiclePreviewContext } from '@renderer/utilities/vehicle-appearance'
import type { ReadyEmits } from '../utilities'
import Trailer from './trailer/trailer.vue'
import Truck from './truck/truck.vue'

type Props = {
	xml: TruckXML
	file: IFile
}

defineProps<Props>()
defineEmits<ReadyEmits & { previewContext: [context: VehiclePreviewContext] }>()
</script>

<style lang='scss' scoped>
.table {
	padding: 12px;
	container-type: inline-size;
	container-name: vehicle-settings;
	min-height: 0;
	flex: 1 1 0;
	overflow-y: auto;

	:global(.ant-input),
	:global(.ant-input-number-input) {
		width: 150px;
	}

	@media (max-width: 760px) {
		padding: 12px;

		:global(.ant-input),
		:global(.ant-input-number),
		:global(.ant-input-number-input) {
			width: 100%;
		}
	}
}
</style>
