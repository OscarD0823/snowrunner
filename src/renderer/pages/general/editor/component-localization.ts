import { Localization, LocalizationStrings } from '@localization'
import { loadLocalization } from '@localization/renderer'

export const COMPONENT_EDITOR_LOCALIZATION = loadLocalization(new Localization({
	save: new LocalizationStrings().es('Guardar cambios').en('Save changes'),
	saved: new LocalizationStrings().es('Componente guardado en el archivo del juego').en('Component saved to the game archive'),
	error: new LocalizationStrings().es('No se pudo leer este archivo como un componente editable.').en('This file could not be read as an editable component.'),
	description: new LocalizationStrings().es('Edita los valores del archivo y guarda para aplicarlos al juego.').en('Edit the file values and save to apply them to the game.'),
	engines: new LocalizationStrings().es('Biblioteca de motores').en('Engine library'),
	wheels: new LocalizationStrings().es('Biblioteca de neumáticos').en('Tire library'),
	winches: new LocalizationStrings().es('Biblioteca de cabrestantes').en('Winch library')
}))
