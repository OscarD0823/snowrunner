<template>
  <div :class="{ 'language--compact': compact }">
    <div
      v-if="radioMode"
      class="language-grid"
      role="radiogroup"
      :aria-label="texts.languageLabel"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="language-option"
        :class="{ 'language-option--active': config.lang === option.value }"
        role="radio"
        :aria-checked="config.lang === option.value"
        @click="changeLang(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
    <template v-else-if="!compact">
      <label
        for="lang-select"
        class="lang-label"
      >
        {{ texts.languageLabel }}
      </label>
      <Select
        id="lang-select"
        :value="config.lang"
        :options="options"
        size="large"
        @change="value => changeLang(parseStrToLang(value?.toString() || ''))"
      />
    </template>
    <label
      v-else
      class="compact-language"
      :title="texts.languageLabel"
    >
      <GlobalOutlined />
      <Select
        :value="config.lang"
        :options="options"
        size="middle"
        :aria-label="texts.languageLabel"
        @change="value => changeLang(parseStrToLang(value?.toString() || ''))"
      />
    </label>
  </div>
</template>

<script lang='ts' setup>
import { GlobalOutlined } from '@ant-design/icons-vue'
import { Lang, parseStrToLang } from '@modules/data/config/enums'
import { di } from '@utilities/di/container'
import { CONFIG_MANAGER_TOKEN, CONFIG_TOKEN, GAME_TEXTS_TOKEN } from '@utilities/di/renderer/tokens'
import { Select } from 'ant-design-vue'
import { nextTick } from 'vue'
import { LANGUAGE_LOCALIZATION as texts } from './localization'

export type LanguageProps = {
	/** Режим горизонтального выбора. */
	radioMode?: boolean
	/** Selector compacto para la barra superior. */
	compact?: boolean
}

defineProps<LanguageProps>()

const options = [
	{ label: '🇪🇸 Español', value: Lang.es },
	{ label: '🇬🇧 English', value: Lang.en },
	{ label: '🇫🇷 Français', value: Lang.fr },
	{ label: '🇮🇹 Italiano', value: Lang.it },
	{ label: '🇩🇪 Deutsch', value: Lang.de },
	{ label: '🇨🇿 Čeština', value: Lang.cs },
	{ label: '🇯🇵 日本語', value: Lang.ja },
	{ label: '🇰🇷 한국어', value: Lang.ko },
	{ label: '🇵🇱 Polski', value: Lang.pl },
	{ label: '🇧🇷 Português (Brasil)', value: Lang.ptBr },
	{ label: '🇷🇺 Русский', value: Lang.ru },
	{ label: '🇨🇳 简体中文', value: Lang.ch },
	{ label: '🇹🇼 繁體中文', value: Lang.zhTw }
]
const config = di.resolve(CONFIG_TOKEN)
const gameTexts = di.resolve(GAME_TEXTS_TOKEN)

/**
 * Изменить язык.
 * @param newLang Новый язык.
 */
async function changeLang(newLang: Lang) {
	if (newLang === config.lang) {
		return
	}

	config.lang = newLang
	await di.resolve(CONFIG_MANAGER_TOKEN).save()
	await nextTick()

	// Durante la bienvenida todavía no hay `initial.pak`. El idioma de la
	// interfaz sí debe cambiar sin intentar leer archivos que aún no existen.
	if (config.initialPath) {
		await gameTexts.initFromInitial()
		await gameTexts.initFromMods()
	}
}

</script>

<style lang='scss' scoped>
.lang-label {
	display: block;
	margin-bottom: 7px;
	color: #64748b;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-align: left;
	text-transform: uppercase;
}

:deep(.ant-select) {
	width: 260px;
}

.language-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
	gap: 8px;
	width: 100%;
	max-height: min(270px, 38vh);
	padding: 2px;
	overflow-y: auto;
}

.language-option {
	min-height: 42px;
	padding: 8px 10px;
	color: #334155;
	background: white;
	border: 1px solid #dbe3ec;
	border-radius: 9px;
	font: inherit;
	font-size: 12px;
	cursor: pointer;
	transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;

	&:hover,
	&:focus-visible {
		border-color: #fb923c;
		outline: none;
		box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
	}

	&--active {
		color: white;
		background: linear-gradient(145deg, #f97316, #ea580c);
		border-color: #ea580c;
		box-shadow: 0 5px 14px rgba(234, 88, 12, 0.2);
	}
}

.compact-language {
	display: flex;
	align-items: center;
	gap: 5px;
	height: 38px;
	padding: 0 7px 0 10px;
	color: #cbd5e1;
	background: rgba(255, 255, 255, 0.07);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 9px;

	:deep(.ant-select) {
		width: 148px;
	}

	:deep(.ant-select-selector) {
		color: #e2e8f0 !important;
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
	}

	:deep(.ant-select-arrow) {
		color: #94a3b8;
	}
}

@media (max-width: 720px) {
	.compact-language {
		padding-inline: 8px;

		:deep(.ant-select) {
			width: 43px;
		}
	}
}
</style>
