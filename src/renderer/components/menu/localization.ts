import { Localization, LocalizationStrings } from '@localization'
import { loadLocalization } from '@localization/renderer'

export const MENU_LOCALIZATION = loadLocalization(new Localization({
  projectLinks: new LocalizationStrings().es('Autor y proyecto en GitHub').en('Author and project on GitHub'),
  githubAuthor: new LocalizationStrings().es('Abrir el perfil de @OscarD0823 en GitHub').en('Open @OscarD0823 on GitHub'),
  githubRepository: new LocalizationStrings().es('Abrir el repositorio de SnowRunner Studio en GitHub').en('Open the SnowRunner Studio repository on GitHub'),
	brandSubtitle: new LocalizationStrings()
		.es('Estudio de configuración de vehículos')
		.en('Vehicle configuration studio'),

	trucksNav: new LocalizationStrings()
		.es('Camiones')
		.en('Trucks'),

	trailersNav: new LocalizationStrings()
		.es('Remolques')
		.en('Trailers'),

	enginesNav: new LocalizationStrings()
		.es('Motores')
		.en('Engines'),

	wheelsNav: new LocalizationStrings()
		.es('Neumáticos')
		.en('Tires'),

	winchesNav: new LocalizationStrings()
		.es('Cabrestantes')
		.en('Winches'),

	editedNav: new LocalizationStrings()
		.es('Modificados')
		.en('Edited'),

	modsNav: new LocalizationStrings()
		.es('Mods')
		.en('Modifications'),

	installationDetected: new LocalizationStrings()
		.es('Instalación detectada:')
		.en('Installation detected:'),

	releasesTitle: new LocalizationStrings()
		.es('Versiones y descargas')
		.en('Releases and downloads'),

	/** Текст кнопки открытия. */
	openButton: new LocalizationStrings()
		.ru('Открыть')
		.en('Open')
		.de('Öffnen')
		.ch('打开'),

	savingMessage: new LocalizationStrings()
		.ru('Сохранение...')
		.en('Saving...')
		.de('Speichern...')
		.ch('保存中'),

	successSaveFiles: new LocalizationStrings()
		.ru('Сохранено')
		.en('Saved')
		.de('Gespeichert')
		.ch('保存成功'),

	/** Текст кнопки сохранения. */
	saveButton: new LocalizationStrings()
		.ru('Сохранить')
		.en('Save')
		.de('Datei')
		.ch('保存'),

	/** Текст элемента `Сбросить`. */
	resetMenuItemLabel: new LocalizationStrings()
		.ru('Сбросить')
		.en('Reset')
		.de('Zurücksetzen')
		.ch('重置'),

	/** Текст элемента `Открыть файлы`. */
	openFilesFolderItemLabel: new LocalizationStrings()
		.ru('Открыть файлы')
		.en('Open Files')
		.de('Dateien öffnen')
		.ch('打开文件'),

	/** Текст элемента `Обновить архив`. */
	saveFilesItemLabel: new LocalizationStrings()
		.ru('Обновить архив')
		.en('Update archive')
		.de('Archiv aktualisieren')
		.ch('更新存档'),

	/** Текст элемента `Распаковать архив`. */
	unpackFilesItemLabel: new LocalizationStrings()
		.ru('Распаковать архив')
		.en('Unpack archive')
		.de('Entpacken Sie das Archiv')
		.ch('解压缩档案'),

	/** Текст элемента `Выход`. */
	exitMenuItemLabel: new LocalizationStrings()
		.ru('Выход')
		.en('Exit')
		.de('Exit')
		.ch('退出'),

	/** Заголовок меню `Настройки`. */
	settingsMenuLabel: new LocalizationStrings()
		.ru('Настройки')
		.en('Settings')
		.de('Einstellungen')
		.ch('设置'),

	/** Текст элемента `Удалить программу`. */
	uninstallMenuItemLabel: new LocalizationStrings()
		.ru('Удалить программу')
		.en('Uninstall the program')
		.de('Programm deinstallieren')
		.ch('卸载程序'),

	/** Текст элемента `Восстановить`. */
	restoreMenuItemLabel: new LocalizationStrings()
		.ru('Восстановить')
		.en('Restore')
		.de('Standard Wiederherstellen')
		.ch('还原'),

	/** Заголовок меню `Бэкап`. */
	backupMenuLabel: new LocalizationStrings()
		.ru('Бэкап')
		.en('Backup')
		.de('Sicherung')
		.ch('备份'),

	/** Заголовок меню `Файл`. */
	fileMenuLabel: new LocalizationStrings()
		.ru('Файл')
		.en('File')
		.de('Datei')
		.ch('文件'),

	/** Заголовок меню `Помощь`. */
	helpMenuLabel: new LocalizationStrings()
		.ru('Помощь')
		.en('Help')
		.de('Hilfe')
		.ch('帮助'),

	/** Заголовок меню `Как пользоваться`. */
	howToUseTitle: new LocalizationStrings()
		.ru('Как пользоваться')
		.en('How to use')
		.de('Wie benutzt man')
		.ch('如何使用'),

	/** Текст элемента `Версия`. */
	versionMenuItemLabel: new LocalizationStrings()
		.ru('Версия')
		.en('Version')
		.de('Ausführung')
		.ch('版本'),

	/** Текст элемента `GitHub`. */
	githubTitle: new LocalizationStrings()
		.ru('Github')
		.en('Github')
		.de('Github')
		.ch('Github'),

	/** Текст элемента `YouTube`. */
	youtubeTitle: new LocalizationStrings()
		.ru('YouTube(RU)')
		.en('YouTube(RU)')
		.de('YouTube(RU)')
		.ch('YouTube(RU)'),

	donationTitle: new LocalizationStrings()
		.ru('Поддержать')
		.en('Support')
		.de('Unterstützen')
		.ch('支持')
}))
