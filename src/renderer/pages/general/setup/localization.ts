import { Localization, LocalizationStrings } from '@localization'
import { loadLocalization } from '@localization/renderer'

export const SETUP_LOCALIZATION = loadLocalization(new Localization({
	next: new LocalizationStrings()
		.ru('Дальше')
		.en('Next')
		.de('Nächsten')
		.ch('下一个'),

	languageLabel: new LocalizationStrings()
		.ru('Язык программы')
		.en('Program language')
		.de('Programmsprache')
		.ch('方案语言'),

	gameFolderLabel: new LocalizationStrings()
		.ru('Папка с игрой')
		.en('Game folder')
		.de('Spiel-Ordner')
		.ch('游戏文件夹'),

	gameDataStep: new LocalizationStrings()
		.ru('Игровые данные')
		.en('Game data')
		.de('Spieldaten')
		.ch('游戏数据'),

	firstStepsDescription: new LocalizationStrings()
		.ru('Первоначальная настройка')
		.en('Initial setup of the program')
		.de('Ersteinrichtung des Programms')
		.ch('初始设置'),

	importConfigMessage: new LocalizationStrings()
		.ru('Обнаружены настройки программы с предыдущей версии. Хотите использовать их?')
		.en('The program settings from the previous version have been detected. Do you want to use them?')
		.de('Programmeinstellungen aus einer früheren Version wurden gefunden. Willst du sie benutzen?')
		.ch('找到了以前版本的程序设置。你愿意使用它们吗？'),

	emptyFolderError: new LocalizationStrings()
		.ru('Вы не выбрали папку!')
		.en('You didn\'t select a folder!')
		.de('Sie haben keinen Ordner ausgewählt!')
		.ch('你没有选择一个文件夹!'),

	invalidFolderError: new LocalizationStrings()
		.ru('Вы выбрали неправильную папку. Попробуйте вручную выбрать initial.pak')
		.en('You have selected the wrong folder!')
		.de('Sie haben den falschen Ordner ausgewählt!')
		.ch('你选择了错误的文件夹。尝试手动选择initial.pak'),

	invalidInitialError: new LocalizationStrings()
		.ru('Выбран неверный initial.pak')
		.en('Invalid initial.pak selected')
		.de('Ungültiger initial ausgewählt.pak')
		.ch('选择了错误的initial.pak'),

	ok: new LocalizationStrings()
		.ru('Ок')
		.en('Ok')
		.de('Ok')
		.ch('确认'),

	cancel: new LocalizationStrings()
		.ru('Отменить')
		.en('Cancel')
		.de('Stornieren')
		.ch('取消'),

	welcomeTitle: new LocalizationStrings()
		.es('Prepara tu editor de SnowRunner')
		.en('Set up your SnowRunner editor'),

	welcomeDescription: new LocalizationStrings()
		.es('Primero elige el idioma y después indica dónde está el archivo initial.pak del juego.')
		.en('Choose the language, then tell us where the game initial.pak file is located.'),

	languageHelp: new LocalizationStrings()
		.es('Podrás cambiarlo más adelante desde Ajustes.')
		.en('You can change it later in Settings.'),

	gameDataHelp: new LocalizationStrings()
		.es('La opción recomendada busca initial.pak dentro de la carpeta de instalación. También puedes seleccionarlo manualmente.')
		.en('The recommended option finds initial.pak inside the installation folder. You can also select it manually.'),

	safetyNote: new LocalizationStrings()
		.es('Antes de editar se creará una copia de seguridad de initial.pak.')
		.en('A backup of initial.pak will be created before editing.'),

	folderOptionTitle: new LocalizationStrings()
		.es('Buscar desde la carpeta del juego')
		.en('Find it from the game folder'),

	folderOptionDescription: new LocalizationStrings()
		.es('Recomendado para instalaciones de Steam')
		.en('Recommended for Steam installations'),

	fileOptionTitle: new LocalizationStrings()
		.es('Elegir initial.pak manualmente')
		.en('Choose initial.pak manually'),

	fileOptionDescription: new LocalizationStrings()
		.es('Para otras tiendas o una ruta personalizada')
		.en('For other stores or a custom path')
}))
