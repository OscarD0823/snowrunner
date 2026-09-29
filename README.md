# SnowRunner Studio

Editor visual multilingüe de archivos XML de **SnowRunner**, pensado para que cada ajuste explique con claridad qué modifica.

La aplicación permite explorar vehículos y remolques, cambiar sus parámetros desde una interfaz gráfica y guardar los cambios de nuevo en `initial.pak`. Antes de editar crea una copia de seguridad del archivo original.

## Estado del proyecto

La versión `2.0.2` incluye:

- interfaz y descripciones técnicas completas en español;
- asistente inicial que explica cómo localizar `initial.pak`;
- acciones visibles para guardar, importar, exportar y restablecer;
- filtros con etiquetas claras para vehículos, remolques, DLC y modificaciones;
- diseño renovado y copia de seguridad antes de editar;
- navegación separada para camiones, remolques, elementos modificados y mods;
- vistas de tarjetas y lista, con detección manual de contenido nuevo;
- los 13 idiomas de interfaz disponibles oficialmente en SnowRunner;
- imágenes de los mods cuando el paquete incluye una miniatura compatible;
- extracción local de las carátulas oficiales desde `gfx.pak`, sin descargar imágenes de terceros;
- asociación manual de PNG, JPEG o WebP para tráileres de misión que no tienen carátula de tienda;
- título de ventana limpio y diseño adaptable para usar la aplicación en media pantalla;
- prueba automática de todas las imágenes incluidas y de las carátulas extraídas;
- instalador de Windows y actualizaciones automáticas mediante GitHub Releases.

Los nombres de vehículos y objetos se leen de los textos incluidos por el propio juego. Cuando SnowRunner no proporciona una cadena en español, se utiliza el nombre inglés.

Las carátulas se regeneran cuando cambia `gfx.pak`. En la instalación comprobada se encontraron 122 símbolos gráficos y las 120 referencias usadas por los XML de vehículos tuvieron coincidencia. Algunos tráileres de misión no declaran `UiIcon328x458`; en esos casos se muestra la imagen predeterminada hasta que el usuario elige una imagen local con clic derecho.

## Ejecutar en Windows

Requisitos: Node.js 22 o una versión compatible y npm.

```powershell
npm install
npm start
```

Para crear el instalador ejecutable:

```powershell
npm run build:exe
```

El resultado se guarda dentro de `out/make/squirrel.windows/x64`. El archivo `SnowRunner Studio Setup.exe` instala la aplicación y crea sus accesos directos.

## Publicar una versión

Actualiza la versión de `package.json`, crea un tag con el formato `vX.Y.Z` y súbelo a GitHub. El flujo de GitHub Actions compila el instalador y adjunta `Setup.exe`, el paquete `.nupkg` y `RELEASES` a una nueva publicación. Las instalaciones existentes consultan esas publicaciones al abrirse y cada 30 minutos.

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
