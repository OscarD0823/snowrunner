<template>
  <Collapse
    class="collapse"
    accordion
    @change="onKeyChange"
  >
    <slot />
  </Collapse>
</template>

<script lang='ts' setup>
import { Collapse } from 'ant-design-vue'
import { provideActive } from './utilities'

const emit = defineEmits<{ change: [key: string | undefined] }>()
const active = provideActive(true)
const onKeyChange: import('ant-design-vue').CollapseProps['onChange'] = key => {
  active.onKeyChange?.(key)
  emit('change', Array.isArray(key) ? key[0]?.toString() : key?.toString())
}
</script>

<style lang="scss">
.collapse {
	width: 100%;
}
</style>
