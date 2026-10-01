import { Page } from '@modules/windows/enums'
import { di } from '@utilities/di/container'
import { CONFIG_TOKEN } from '@utilities/di/renderer/tokens'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePageStore = defineStore('page', () => {
	// El evento inicial puede llegar antes de que Vue termine de montar la
	// suscripción. La configuración compartida ofrece un estado inicial fiable.
	const page = ref(di.resolve(CONFIG_TOKEN).initialPath ? Page.lists : Page.setup)

	return {
		/** Изменить текущую страницу */
		route(newPage: Page) {
			page.value = newPage
		},
		/** Текущая страница */
		page
	}
})
