# Desarrollo · SnowRunner Studio

[Portada](../README.md) · [Documentación](README.md)

## Preparación

Requisitos: Windows x64, Node.js 22 o una versión compatible y npm.

```powershell
git clone https://github.com/OscarD0823/snowrunner.git
cd snowrunner
npm ci
npm run check
npm start
```

No se incluyen archivos del juego. Para pruebas con modelos originales necesitas una instalación local compatible.

## Estructura

```text
src/main/             Proceso principal de Electron
src/renderer/         Interfaz Vue
src/modules/          XML, archivos, visor y funciones del editor
src/build-configs/    Configuración activa de compilación
scripts/              Pruebas y herramientas
docs/                 Guías, releases/ y archive/
.github/workflows/    Comprobaciones y publicación
```

Los avisos legales permanecen en la raíz: [LICENSE](../LICENSE), [NOTICE.md](../NOTICE.md), [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) y [PRIVACY.md](../PRIVACY.md). Algunos se usan durante la compilación; no se deben mover sin adaptar sus referencias.

## Comprobar cambios

```powershell
npm run check
npm run lint
npm test
node scripts/check-docs.mjs
```

Las pruebas visuales están en `npm run test:ui`. Para recorrer todos los modelos instalados, después de generar el ejecutable:

```powershell
$env:SNOWRUNNER_ALL_MODELS = '1'
node scripts/test-library-ui.mjs
Remove-Item Env:\SNOWRUNNER_ALL_MODELS
```

Revisa también las carátulas representativas y los formatos no compatibles. La carga correcta del modelo no garantiza identidad visual o física con el juego.

El comprobador de documentación valida enlaces locales, imágenes, índices de versiones y la versión documental, sin instalar dependencias. Se ejecuta también en GitHub Actions para cambios de documentación.

## Compilar y publicar

```powershell
npm run build:exe
```

El instalador y sus archivos de actualización se generan en `out/make/squirrel.windows/x64`. La configuración activa usa Electron Forge y Squirrel; los antiguos preparativos de Store e Inno Setup están [archivados](archive/README.md) y no forman parte de la compilación.

Para publicar: actualiza la versión de `package.json`, `package-lock.json` y `docs/version-info.json`; añade `docs/releases/X.Y.Z.md` y su entrada en [CHANGELOG.md](../CHANGELOG.md), y ejecuta las comprobaciones. Crea y sube el tag `vX.Y.Z`; el flujo de publicación construye y adjunta Setup.exe, el paquete .nupkg y RELEASES. No reutilices tags publicados.

Las instalaciones consultan GitHub Releases al abrirse y cada 30 minutos. `docs/version-info.json` es metadato documental, no la fuente del actualizador. Ordenar documentación no requiere cambiar la versión ni generar un instalador nuevo.
