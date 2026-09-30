<template>
  <Modal
    v-model:open="isOpen"
    :title="`${texts.whatsNewTitle} ${appConstants.VERSION}`"
  >
    <div class="container">
      <VersionInfo :changes="info" />
    </div>

    <template #footer>
      <Button
        key="submit"
        type="primary"
        @click="isOpen = false"
      >
        Ok
      </Button>
    </template>
  </Modal>
</template>

<script lang='ts' setup>
import { LocalizationStrings } from '@localization'
import { di } from '@utilities/di/container'
import { APP_CONSTANTS_TOKEN, CONFIG_TOKEN } from '@utilities/di/renderer/tokens'
import { Button, Modal } from 'ant-design-vue'
import { computed } from 'vue'
import { WHATS_NEW_LOCALIZATION as texts } from './localization'
import VersionInfo from './version-info.vue'

const config = di.resolve(CONFIG_TOKEN)
const appConstants = di.resolve(APP_CONSTANTS_TOKEN)

/** Открыто ли модальное окно. */
const isOpen = defineModel<boolean>({ required: true })
const info = computed(() => new LocalizationStrings<string[]>()
	.es([
		'Catálogo más rápido y compacto, inspirado en RoadCraft Studio',
		'Nueva distribución de navegación, idioma, ajustes y ruta del juego',
		'Mejor cobertura de imágenes para variantes de remolques',
		'Editor adaptable para trabajar cómodamente en media pantalla'
	])
	.ru([
		'Более быстрый и компактный каталог',
		'Обновлена навигация и отображение пути к игре',
		'Улучшено отображение изображений прицепов',
		'Редактор адаптирован для разделённого экрана'
	])
	.en([
		'Faster, more compact catalog inspired by RoadCraft Studio',
		'Redesigned navigation, language, settings and game path layout',
		'Improved image coverage for trailer variants',
		'Responsive editor for comfortable split-screen use'
	])
	.de([
		'Schnellerer und kompakterer Katalog',
		'Navigation und Anzeige des Spielpfads wurden überarbeitet',
		'Bessere Bildabdeckung für Anhängervarianten',
		'Anpassbarer Editor für geteilte Bildschirme'
	])
	.ch([
		'更快、更紧凑的目录',
		'重新设计了导航和游戏路径显示',
		'改进了拖车变体的图片覆盖',
		'编辑器现已适配分屏使用'
	])
	.get(config)
)
</script>

<style lang='scss' scoped>
.container {
	overflow: auto;
	background-color: white;
}
</style>
