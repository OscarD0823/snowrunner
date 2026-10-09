import { Localization, LocalizationStrings } from '@localization'
import { loadLocalization } from '@localization/renderer'

export const UPDATE_LOCALIZATION = loadLocalization(new Localization({
	updatesTitle: new LocalizationStrings().es("Actualizaciones").en("Updates"),
	updatesInstalled: new LocalizationStrings().es("Versión instalada").en("Installed version"),
	updatesOptional: new LocalizationStrings().es("Actualizar es opcional. GitHub solo se consulta al pulsar «Buscar actualizaciones». No se descargará ni instalará nada automáticamente.").en("Updating is optional. GitHub is contacted only when you select “Check for updates”. Nothing is downloaded or installed automatically."),
	updatesChecking: new LocalizationStrings().es("Buscando actualizaciones…").en("Checking for updates…"),
	updatesError: new LocalizationStrings().es("No se pudo comprobar o abrir la actualización. Revisa tu conexión e inténtalo de nuevo. Puedes seguir usando el programa.").en("The update could not be checked or opened. Check your connection and try again. You can keep using the app."),
	updates_idle: new LocalizationStrings().es("Busca una nueva versión cuando quieras.").en("Check for a new version whenever you want."),
	updates_available: new LocalizationStrings().es("Hay una versión nueva. Tú decides si actualizar.").en("A new version is available. Updating is your choice."),
	updates_current: new LocalizationStrings().es("Ya usas esta versión o una más reciente.").en("You are using this version or a newer one."),
	updates_empty: new LocalizationStrings().es("Todavía no hay una versión estable publicada.").en("No stable release has been published yet."),
	updatesNoInstaller: new LocalizationStrings().es("El instalador todavía no está publicado. Revisa las notas o vuelve a buscar más tarde.").en("The installer is not published yet. Read the release notes or check again later."),
	updatesInstallHelp: new LocalizationStrings().es("La descarga se abre en tu navegador. Antes de ejecutar el instalador, guarda tus cambios y cierra el editor. No cambia los archivos del juego.").en("The download opens in your browser. Save your changes and close the editor before running the installer. This does not change game files."),
	updatesCheck: new LocalizationStrings().es("Buscar actualizaciones").en("Check for updates"),
	updatesDownload: new LocalizationStrings().es("Descargar instalador").en("Download installer"),
	updatesRelease: new LocalizationStrings().es("Ver versión en GitHub").en("View release on GitHub"),
	updatesLater: new LocalizationStrings().es("Seguir con esta versión").en("Keep this version"),
	updatesClose: new LocalizationStrings().es("Cerrar actualizaciones").en("Close updates")
}))
