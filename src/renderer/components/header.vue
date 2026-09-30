<template>
  <PageHeader
    class="header"
    @back="onBack"
  >
    <template #title>
      <h3 class="header-title">
        {{ text }}
      </h3>
    </template>
    <template #extra>
      <slot name="extra" />
    </template>
  </PageHeader>
</template>

<script lang='ts' setup>
import type { PageHeaderProps } from 'ant-design-vue'
import { PageHeader } from 'ant-design-vue'
import type { EmitsToProps } from '../types'

export type HeaderProps = Props & EmitsToProps<Emits>

type Props = PageHeaderProps & {
	/** Текст заголовка, */
	text: string

	/** Показать кнопку `Назад`. */
	withBack?: boolean
}

type Emits = {
	/** Событие перехода назад. */
	back: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const onBack: PageHeaderProps['onBack'] = props.withBack
	? () => emit('back')
	: undefined
</script>

<style lang='scss' scoped>
.header {
	display: flex;
	align-items: center;
	min-height: 60px;
	padding: 0 20px;
	background: #1e293b;
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	box-shadow: 0 4px 14px rgba(15, 23, 42, 0.14);
	z-index: 1;

	&-title {
		max-width: min(420px, 42vw);
		text-align: left;
		color: #fafafa;
		padding: 0;
		margin: 0;
		font-size: 18px;
		font-weight: 650;
		letter-spacing: 0.01em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.ant-page-header-heading-left),
	:global(.ant-page-header-heading-extra) {
		margin: 0;
	}

	:global(.ant-page-header-heading-left) {
		min-width: 0;
	}

	:global(.ant-page-header-heading) {
		width: 100%;
		align-items: center;
	}

	:global(.ant-page-header-heading-extra) {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	:global(.ant-page-header-back) {
		margin-right: 0 !important;
	}

	@media (max-width: 700px) {
		min-height: 54px;
		padding: 0 10px;

		&-title {
			max-width: 32vw;
			font-size: 15px;
		}

		:global(.ant-page-header-heading-extra) {
			gap: 3px;
		}
	}
}
</style>
