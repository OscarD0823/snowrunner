/**
 * Traducciones comunes para los idiomas oficiales de SnowRunner que no
 * formaban parte del editor original. Los textos técnicos sin equivalencia
 * específica usan inglés como respaldo para no mostrar cadenas vacías.
 */
const COMMON_TRANSLATIONS: Record<string, Partial<Record<string, string>>> = {
	'Current value': { FR: 'Valeur actuelle', IT: 'Valore attuale', CS: 'Aktuální hodnota', JA: '現在の値', KO: '현재 값', PL: 'Bieżąca wartość', 'PT-BR': 'Valor atual', 'ZH-TW': '目前值' },
	'File': { FR: 'Fichier', IT: 'File', CS: 'Soubor', JA: 'ファイル', KO: '파일', PL: 'Plik', 'PT-BR': 'Arquivo', 'ZH-TW': '檔案' },
	'Backup': { FR: 'Sauvegarde', IT: 'Backup', CS: 'Záloha', JA: 'バックアップ', KO: '백업', PL: 'Kopia zapasowa', 'PT-BR': 'Backup', 'ZH-TW': '備份' },
	'Settings': { FR: 'Paramètres', IT: 'Impostazioni', CS: 'Nastavení', JA: '設定', KO: '설정', PL: 'Ustawienia', 'PT-BR': 'Configurações', 'ZH-TW': '設定' },
	'Help': { FR: 'Aide', IT: 'Aiuto', CS: 'Nápověda', JA: 'ヘルプ', KO: '도움말', PL: 'Pomoc', 'PT-BR': 'Ajuda', 'ZH-TW': '說明' },
	'Open': { FR: 'Ouvrir', IT: 'Apri', CS: 'Otevřít', JA: '開く', KO: '열기', PL: 'Otwórz', 'PT-BR': 'Abrir', 'ZH-TW': '開啟' },
	'Save': { FR: 'Enregistrer', IT: 'Salva', CS: 'Uložit', JA: '保存', KO: '저장', PL: 'Zapisz', 'PT-BR': 'Salvar', 'ZH-TW': '儲存' },
	'Exit': { FR: 'Quitter', IT: 'Esci', CS: 'Ukončit', JA: '終了', KO: '종료', PL: 'Zakończ', 'PT-BR': 'Sair', 'ZH-TW': '結束' },
	'Restore': { FR: 'Restaurer', IT: 'Ripristina', CS: 'Obnovit', JA: '復元', KO: '복원', PL: 'Przywróć', 'PT-BR': 'Restaurar', 'ZH-TW': '還原' },
	'Version': { FR: 'Version', IT: 'Versione', CS: 'Verze', JA: 'バージョン', KO: '버전', PL: 'Wersja', 'PT-BR': 'Versão', 'ZH-TW': '版本' },
	'Program language': { FR: 'Langue du programme', IT: 'Lingua del programma', CS: 'Jazyk programu', JA: 'アプリの言語', KO: '앱 언어', PL: 'Język programu', 'PT-BR': 'Idioma do programa', 'ZH-TW': '程式語言' },
	'Update the program': { FR: 'Mettre à jour automatiquement', IT: 'Aggiorna automaticamente', CS: 'Automaticky aktualizovat', JA: '自動更新', KO: '자동 업데이트', PL: 'Aktualizuj automatycznie', 'PT-BR': 'Atualizar automaticamente', 'ZH-TW': '自動更新' },
	'Edit Modifications': { FR: 'Modifier les mods', IT: 'Modifica mod', CS: 'Upravit mody', JA: 'MODを編集', KO: '모드 편집', PL: 'Edytuj mody', 'PT-BR': 'Editar mods', 'ZH-TW': '編輯模組' },
	'Advanced Mode': { FR: 'Mode avancé', IT: 'Modalità avanzata', CS: 'Pokročilý režim', JA: '詳細モード', KO: '고급 모드', PL: 'Tryb zaawansowany', 'PT-BR': 'Modo avançado', 'ZH-TW': '進階模式' },
	'Processing': { FR: 'Traitement', IT: 'Elaborazione', CS: 'Zpracování', JA: '処理中', KO: '처리 중', PL: 'Przetwarzanie', 'PT-BR': 'Processando', 'ZH-TW': '處理中' },
	'Error': { FR: 'Erreur', IT: 'Errore', CS: 'Chyba', JA: 'エラー', KO: '오류', PL: 'Błąd', 'PT-BR': 'Erro', 'ZH-TW': '錯誤' },
	'Reset': { FR: 'Réinitialiser', IT: 'Ripristina', CS: 'Obnovit', JA: 'リセット', KO: '초기화', PL: 'Resetuj', 'PT-BR': 'Redefinir', 'ZH-TW': '重設' },
	'Import': { FR: 'Importer', IT: 'Importa', CS: 'Importovat', JA: 'インポート', KO: '가져오기', PL: 'Importuj', 'PT-BR': 'Importar', 'ZH-TW': '匯入' },
	'Export': { FR: 'Exporter', IT: 'Esporta', CS: 'Exportovat', JA: 'エクスポート', KO: '내보내기', PL: 'Eksportuj', 'PT-BR': 'Exportar', 'ZH-TW': '匯出' },
	'Cancel': { FR: 'Annuler', IT: 'Annulla', CS: 'Zrušit', JA: 'キャンセル', KO: '취소', PL: 'Anuluj', 'PT-BR': 'Cancelar', 'ZH-TW': '取消' },
	'Loading': { FR: 'Chargement', IT: 'Caricamento', CS: 'Načítání', JA: '読み込み中', KO: '불러오는 중', PL: 'Ładowanie', 'PT-BR': 'Carregando', 'ZH-TW': '載入中' },
	'Change': { FR: 'Gérer', IT: 'Gestisci', CS: 'Spravovat', JA: '管理', KO: '관리', PL: 'Zarządzaj', 'PT-BR': 'Gerenciar', 'ZH-TW': '管理' },
	'Modifications': { FR: 'Mods', IT: 'Mod', CS: 'Mody', JA: 'MOD', KO: '모드', PL: 'Mody', 'PT-BR': 'Mods', 'ZH-TW': '模組' },
	'Favorites': { FR: 'Favoris', IT: 'Preferiti', CS: 'Oblíbené', JA: 'お気に入り', KO: '즐겨찾기', PL: 'Ulubione', 'PT-BR': 'Favoritos', 'ZH-TW': '我的最愛' },
	'Edited': { FR: 'Modifiés', IT: 'Modificati', CS: 'Upravené', JA: '編集済み', KO: '편집됨', PL: 'Edytowane', 'PT-BR': 'Editados', 'ZH-TW': '已編輯' },
	'Basic': { FR: 'Jeu de base', IT: 'Gioco base', CS: 'Základní hra', JA: '基本ゲーム', KO: '기본 게임', PL: 'Gra podstawowa', 'PT-BR': 'Jogo base', 'ZH-TW': '主遊戲' },
	'All': { FR: 'Tous', IT: 'Tutti', CS: 'Vše', JA: 'すべて', KO: '전체', PL: 'Wszystkie', 'PT-BR': 'Todos', 'ZH-TW': '全部' },
	'Trucks': { FR: 'Camions', IT: 'Camion', CS: 'Nákladní vozy', JA: 'トラック', KO: '트럭', PL: 'Ciężarówki', 'PT-BR': 'Caminhões', 'ZH-TW': '卡車' },
	'Trailers': { FR: 'Remorques', IT: 'Rimorchi', CS: 'Přívěsy', JA: 'トレーラー', KO: '트레일러', PL: 'Przyczepy', 'PT-BR': 'Reboques', 'ZH-TW': '拖車' },
	'List of trucks': { FR: 'Camions', IT: 'Camion', CS: 'Nákladní vozy', JA: 'トラック', KO: '트럭', PL: 'Ciężarówki', 'PT-BR': 'Caminhões', 'ZH-TW': '卡車' },
	'List of trailers': { FR: 'Remorques', IT: 'Rimorchi', CS: 'Přívěsy', JA: 'トレーラー', KO: '트레일러', PL: 'Przyczepy', 'PT-BR': 'Reboques', 'ZH-TW': '拖車' },
	'Content type': { FR: 'Type de contenu', IT: 'Tipo di contenuto', CS: 'Typ obsahu', JA: 'コンテンツ', KO: '콘텐츠 유형', PL: 'Typ zawartości', 'PT-BR': 'Tipo de conteúdo', 'ZH-TW': '內容類型' },
	'File source': { FR: 'Source des fichiers', IT: 'Origine file', CS: 'Zdroj souborů', JA: 'ファイル元', KO: '파일 출처', PL: 'Źródło plików', 'PT-BR': 'Origem dos arquivos', 'ZH-TW': '檔案來源' },
	'Vehicle class': { FR: 'Classe du véhicule', IT: 'Classe veicolo', CS: 'Třída vozidla', JA: '車両クラス', KO: '차량 등급', PL: 'Klasa pojazdu', 'PT-BR': 'Classe do veículo', 'ZH-TW': '車輛類別' },
	'Search': { FR: 'Rechercher', IT: 'Cerca', CS: 'Hledat', JA: '検索', KO: '검색', PL: 'Szukaj', 'PT-BR': 'Pesquisar', 'ZH-TW': '搜尋' },
	'Vehicle name...': { FR: 'Nom du véhicule...', IT: 'Nome veicolo...', CS: 'Název vozidla...', JA: '車両名...', KO: '차량 이름...', PL: 'Nazwa pojazdu...', 'PT-BR': 'Nome do veículo...', 'ZH-TW': '車輛名稱...' },
	'Library': { FR: 'Bibliothèque', IT: 'Libreria', CS: 'Knihovna', JA: 'ライブラリ', KO: '라이브러리', PL: 'Biblioteka', 'PT-BR': 'Biblioteca', 'ZH-TW': '資料庫' },
	'Sections': { FR: 'Sections', IT: 'Sezioni', CS: 'Sekce', JA: 'セクション', KO: '구역', PL: 'Sekcje', 'PT-BR': 'Seções', 'ZH-TW': '區段' },
	'Modification workspace': { FR: 'Atelier de modification', IT: 'Area di modifica', CS: 'Pracovní plocha úprav', JA: '編集ワークスペース', KO: '편집 작업 공간', PL: 'Obszar modyfikacji', 'PT-BR': 'Central de modificação', 'ZH-TW': '修改工作區' },
	'Scan for new content': { FR: 'Rechercher du contenu', IT: 'Cerca nuovi contenuti', CS: 'Vyhledat nový obsah', JA: '新しいコンテンツを検索', KO: '새 콘텐츠 검색', PL: 'Szukaj nowej zawartości', 'PT-BR': 'Buscar novo conteúdo', 'ZH-TW': '搜尋新內容' },
	'Loading library...': { FR: 'Chargement de la bibliothèque...', IT: 'Caricamento libreria...', CS: 'Načítání knihovny...', JA: 'ライブラリを読み込み中...', KO: '라이브러리 불러오는 중...', PL: 'Ładowanie biblioteki...', 'PT-BR': 'Carregando biblioteca...', 'ZH-TW': '正在載入資料庫...' },
	'items available': { FR: 'éléments disponibles', IT: 'elementi disponibili', CS: 'dostupných položek', JA: '件利用可能', KO: '개 사용 가능', PL: 'dostępnych elementów', 'PT-BR': 'itens disponíveis', 'ZH-TW': '個可用項目' },
	'Cards': { FR: 'Cartes', IT: 'Schede', CS: 'Karty', JA: 'カード', KO: '카드', PL: 'Karty', 'PT-BR': 'Cartões', 'ZH-TW': '卡片' },
	'List': { FR: 'Liste', IT: 'Elenco', CS: 'Seznam', JA: 'リスト', KO: '목록', PL: 'Lista', 'PT-BR': 'Lista', 'ZH-TW': '清單' },
	'View': { FR: 'Affichage', IT: 'Vista', CS: 'Zobrazení', JA: '表示', KO: '보기', PL: 'Widok', 'PT-BR': 'Visualização', 'ZH-TW': '檢視' }
}

export function translateFallback<T>(value: T, lang: string): T {
	if (typeof value !== 'string') {
		return value
	}

	return (COMMON_TRANSLATIONS[value]?.[lang] ?? value) as T
}
