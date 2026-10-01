<template>
  <article
    v-show="isShow"
    class="component-card"
    role="button"
    tabindex="0"
    @click="openEditor"
    @keydown.enter="openEditor"
  >
    <div
      class="component-cover"
      :class="`component-cover--${category}`"
    >
      <svg
        v-if="category === Category.engines"
        viewBox="0 0 220 150"
        aria-hidden="true"
      >
        <path d="M47 54h88l25 24v39H47z" />
        <path d="M65 38h49v24H65zM160 86h25v21h-25zM72 82h57M72 99h57" />
        <circle
          cx="70"
          cy="120"
          r="13"
        /><circle
          cx="145"
          cy="120"
          r="13"
        />
      </svg>
      <TirePreview v-else-if="category === Category.wheels" :radius="presentation?.radius" :width="presentation?.width" :pattern="presentation?.pattern || file.name" />
      <svg
        v-else
        viewBox="0 0 220 150"
        aria-hidden="true"
      >
        <path d="M45 51h130v50H45zM62 40v72M158 40v72" />
        <path d="M76 63c21-13 47-13 68 0v27c-21 13-47 13-68 0z" />
        <path d="M110 101v26h38" /><circle
          cx="157"
          cy="127"
          r="9"
        />
      </svg>
      <span>{{ categoryLabel }}</span>
    </div>
    <div class="component-copy">
      <strong>{{ displayName }}</strong>
      <span>{{ optionCount }} {{ texts.componentOptions }}</span>
      <p class="component-variants">{{ presentation?.variants.slice(0, 3).join(' · ') }}</p>
      <p class="component-compatible" :title="presentation?.compatible.join(', ')">
        {{ presentation?.compatible.length ? `${presentationTexts.compatible}: ${presentation.compatible.slice(0, 2).join(', ')}${presentation.compatible.length > 2 ? ` +${presentation.compatible.length - 2}` : ''}` : presentationTexts.unassigned }}
      </p>
      <small>{{ texts.componentOpenHint }} <ArrowRightOutlined /></small>
    </div>
    <div class="component-indicators">
      <StarFilled v-if="isFavorite" />
      <EditFilled v-if="isEdited" />
    </div>
  </article>
</template>

<script lang="ts" setup>
import { ArrowRightOutlined, EditFilled, StarFilled } from '@ant-design/icons-vue'
import type { IFile } from '@modules/files/types'
import { Page } from '@modules/windows/enums'
import TirePreview from '@renderer/components/tire-preview.vue'
import { presentComponent, COMPONENT_PRESENTATION_TEXTS as presentationTexts, type ComponentPresentation } from '@renderer/utilities/component-presentation'
import { useEditorStore } from '@renderer/pages/general/store/editor'
import { useListStore } from '@renderer/pages/general/store/list'
import { usePageStore } from '@renderer/pages/general/store/page'
import { di } from '@utilities/di/container'
import { EDITED_TOKEN, FAVORITES_TOKEN } from '@utilities/di/renderer/tokens'
import { prettyString } from '@utilities/strings/renderer'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { Category, type ComponentCategory } from '../../../enums'
import { LISTS_LOCALIZATION as texts } from '../../localization'

type Props = {
	file: IFile
	category: ComponentCategory
}

const props = defineProps<Props>()
const optionCount = ref(0)
const presentation = ref<ComponentPresentation>()
const displayName = computed(() => presentation.value?.title ?? prettyString(props.file.name))
const favorites = di.resolve(FAVORITES_TOKEN)
const edited = di.resolve(EDITED_TOKEN)
const { name } = storeToRefs(useListStore())
const editorStore = useEditorStore()
const { route } = usePageStore()

const categoryLabel = computed(() => ({
	[Category.engines]: texts.enginesListTitle,
	[Category.wheels]: texts.wheelsListTitle,
	[Category.winches]: texts.winchesListTitle
})[props.category])
const isShow = computed(() => !name.value || [displayName.value, props.file.name, ...(presentation.value?.variants ?? []), ...(presentation.value?.compatible ?? [])].join(' ').toLowerCase().includes(name.value.toLowerCase()))
const isFavorite = computed(() => favorites.isFavorite(props.file))
const isEdited = computed(() => edited.isEdited(props.file))

onMounted(loadCount)

async function loadCount() {
	try {
		presentation.value = await presentComponent(props.file, props.category)
		optionCount.value = presentation.value.variants.length
	} catch (error) { console.warn('No se pudo describir el componente.', error) }
}

function openEditor() {
	editorStore.clearEditorStore()
	editorStore.setFile(props.file)
	editorStore.setComponentCategory(props.category)
	route(Page.editor)
}
</script>

<style lang="scss" scoped>
.component-card {
	position: relative;
	min-width: 0;
	min-height: 283px;
	height: fit-content;
	background: white;
	border: 1px solid #dbe3ec;
	border-radius: 14px;
	overflow: hidden;
	box-shadow: 0 4px 14px rgba(15, 23, 42, 0.07);
	cursor: pointer;
	transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;

	&:hover,
	&:focus-visible {
		transform: translateY(-3px);
		border-color: #fb923c;
		outline: none;
		box-shadow: 0 12px 28px rgba(15, 23, 42, 0.13);
	}
}

.component-cover {
	display: grid;
	position: relative;
	height: 190px;
	place-items: center;
	color: #f8fafc;
	background:
		radial-gradient(circle at 28% 22%, rgba(255, 255, 255, 0.2), transparent 25%),
		linear-gradient(145deg, #1e293b, #0f172a);

	&--wheels { background: linear-gradient(145deg, #0f766e, #0f172a); }
	&--winches { background: linear-gradient(145deg, #9a3412, #1f2937); }

	svg {
		width: 72%;
		height: 72%;
		fill: none;
		stroke: currentColor;
		stroke-width: 7;
		stroke-linecap: round;
		stroke-linejoin: round;
		filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.24));
	}

	span {
		position: absolute;
		bottom: 12px;
		left: 13px;
		padding: 5px 8px;
		background: rgba(15, 23, 42, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 7px;
		font-size: 10px;
		font-weight: 750;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
}

.component-copy {
	display: flex;
	min-height: 91px;
	padding: 13px 14px 15px;
	box-sizing: border-box;
	flex-direction: column;
	align-items: flex-start;

	strong {
		max-width: 100%;
		color: #172033;
		font-size: 14px;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	span,
	small {
		color: #64748b;
		font-size: 11px;
	}

	small {
		margin-top: auto;
		color: #c2410c;
		font-weight: 650;
	}
}

.component-variants, .component-compatible { margin: 5px 0; font-size: 11px; line-height: 1.5; color: #475569; }
.component-compatible { color: #64748b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.component-indicators {
	position: absolute;
	top: 10px;
	right: 10px;
	display: flex;
	gap: 7px;
	color: #fbbf24;
}
</style>
