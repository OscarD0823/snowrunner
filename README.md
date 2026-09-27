# SnowRunner Studio

Editor visual de archivos XML de **SnowRunner**, adaptado al español y pensado para que cada ajuste explique con claridad qué modifica.

La aplicación permite explorar vehículos y remolques, cambiar sus parámetros desde una interfaz gráfica y guardar los cambios de nuevo en `initial.pak`. Antes de editar crea una copia de seguridad del archivo original.

## Estado del proyecto

Esta es la primera versión propia (`0.1.0`). Incluye:

- interfaz y descripciones técnicas completas en español;
- asistente inicial que explica cómo localizar `initial.pak`;
- acciones visibles para guardar, importar, exportar y restablecer;
- filtros con etiquetas claras para vehículos, remolques, DLC y modificaciones;
- diseño renovado y copia de seguridad antes de editar;
- selector de idioma, conservando los idiomas del proyecto original.

Los nombres de vehículos y objetos se leen de los textos incluidos por el propio juego. Cuando SnowRunner no proporciona una cadena en español, se utiliza el nombre inglés.

## Ejecutar en Windows

Requisitos: Node.js 22 o una versión compatible y npm.

```powershell
npm install
npm start
```

Para crear la versión ejecutable portable:

```powershell
npm run build:exe
```

El resultado se guarda dentro de `out/SnowRunner Studio-win32-x64`. La carpeta `resources` debe permanecer junto al ejecutable.

## Comprobaciones de desarrollo

```powershell
npm run check
npm run lint
```

## Estructura principal

- `src/main`: proceso principal de Electron.
- `src/renderer`: interfaz Vue.
- `src/modules/xml`: modelos y descriptores de los parámetros XML.
- `src/utilities/localization/spanish.ts`: terminología y traducciones españolas.
- `src/modules/archiver`: lectura y escritura de `initial.pak`.

## Licencia y avisos

SnowRunner Studio es una aplicación con identidad, interfaz y flujo de trabajo propios. El repositorio conserva en `LICENSE` y `NOTICE.md` los avisos exigidos para el código de terceros utilizado bajo licencia MIT.

SnowRunner es una marca de sus respectivos propietarios. Este proyecto no está afiliado con Saber Interactive ni Focus Entertainment.
