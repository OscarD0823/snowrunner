<template>
  <div>
    <Segmented 
      v-if="radioMode"
      :value="config.lang"
      :options="options"
      size="large"
      @change="changeLang(parseStrToLang(String($event)))"
    />
    <template v-else>
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
  </div>
</template>

<script lang='ts' setup>
import { Lang, parseStrToLang } from '@modules/data/config/enums'
import { di } from '@utilities/di/container'
import { CONFIG_MANAGER_TOKEN, CONFIG_TOKEN, GAME_TEXTS_TOKEN } from '@utilities/di/renderer/tokens'
import { Segmented, Select } from 'ant-design-vue'
import { nextTick } from 'vue'
import { LANGUAGE_LOCALIZATION as texts } from './localization'

export type LanguageProps = {
	/** Режим горизонтального выбора. */
	radioMode?: boolean
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
	await gameTexts.initFromInitial()
	await gameTexts.initFromMods()
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
</style>
