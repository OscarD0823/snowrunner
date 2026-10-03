# SnowRunner Studio

Editor visual multilingüe de archivos XML de **SnowRunner**, pensado para que cada ajuste explique con claridad qué modifica.

La aplicación permite explorar vehículos y remolques, cambiar sus parámetros desde una interfaz gráfica y guardar los cambios de nuevo en `initial.pak`. Antes de editar crea una copia de seguridad del archivo original.

## Estado del proyecto

La versión `2.5.0` incluye:

- vehículo siempre visible en un panel lateral y ajustes con desplazamiento independiente a su derecha;
- cámara que encuadra el modelo completo, también al dividir la pantalla o cambiar ruedas y suspensión;
- materiales originales con relieve, rugosidad, metal y oclusión, conservando los canales PBR definidos por Saber;
- selección correcta de la cabina exterior, sin superponer mallas interiores ni superficies auxiliares de agua;
- selección separada de las ruedas delanteras y dobles traseras, con la llanta predeterminada del XML;
- selector de neumáticos o suspensión visible únicamente al editar ese componente;
- campos, etiquetas y recomendaciones adaptables al ancho del editor, sin desplazamiento lateral en media pantalla;
- animación del camión también dentro de la biblioteca;
- visor 3D de los modelos originales de camiones y remolques, leído localmente de `shared.pak` y `editor.pak`;
- neumáticos y llantas originales colocados en las posiciones declaradas por cada camión;
- selección visual de neumáticos compatibles y suspensión, sin guardar automáticamente esos cambios;
- ruedas en movimiento, cámara giratoria, acercamiento, pausa y recorrido entre bosque, barro, rocas y nieve;
- respeto por movimiento reducido y liberación del visor al salir del editor;

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
- catálogo compacto inspirado en el flujo de RoadCraft Studio, con idioma, ajustes, navegación y ruta del juego mejor distribuidos;
- carga acelerada: analiza únicamente los XML reales de vehículos y remolques, sin recorrer accesorios ni personalizaciones;
- zona de trabajo pesada junto a la instalación del juego, evitando bloqueos en unidades C casi llenas;
- tarjetas más compactas y equivalencias visuales para variantes de remolques de la misma familia;
- editor adaptable con campos, valores originales y recomendaciones Poco/Medio/Alto legibles en media pantalla;
- prueba automática de todas las imágenes, la clasificación instalada y las carátulas oficiales extraídas;
- instalador de Windows y actualizaciones automáticas mediante GitHub Releases.
- selección de instalación Steam corregida: guarda la ruta y reinicia antes de extraer, evitando cierres y uso accidental de C:;
- bienvenida adaptable con selector de 13 idiomas que nunca sale de la ventana;
- apertura animada propia, accesible y compatible con movimiento reducido;
- recorrido de un camión desde el logo hasta la zona de idioma, sobre nieve, rocas y barro, con el nombre del programa como carga;
- lectura regional corregida para los Ford CLT9000 y F 750 y carátula visible dentro del editor;
- extracción de los 13 idiomas del juego y migración del español sin sobrescribir los XML editados;
- nombres de variantes y vehículos compatibles en cada biblioteca de componentes, con explicaciones visibles en español;
- vistas 3D representativas propias para neumáticos y familias de remolques, sin incorporar modelos originales;
- bibliotecas independientes y editables para motores, neumáticos y cabrestantes;
- carátulas oficiales obtenidas solo desde `gfx.pak`, con validación e invalidación del caché al buscar contenido nuevo;
- motor ZIP integrado que conserva las rutas internas de SnowRunner y elimina la redistribución no autorizada de WinRAR;
- distribución únicamente en GitHub, con instalador y actualizaciones automáticas.

Los nombres de vehículos y objetos se leen de los textos incluidos por el propio juego. Cuando SnowRunner no proporciona una cadena en español, se utiliza el nombre inglés.

Las carátulas se regeneran cuando cambia `gfx.pak`. En la instalación comprobada se encontraron 122 símbolos gráficos y las 118 referencias usadas por los XML de vehículos tuvieron coincidencia. Los remolques no declaran `UiIcon328x458`; la aplicación muestra una vista representativa 3D de su familia, una imagen incluida por el mod o una imagen local elegida por el usuario con clic derecho. Las vistas de neumáticos usan las proporciones del XML y un dibujo representativo; no son los modelos originales ni prometen visualizar cambios físicos de agarre.

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

La distribución actual es exclusiva de GitHub. La preparación anterior para Microsoft Store ya no está activa.

## Publicar una versión

El visor usa la geometría y los mapas de color, normales y sombreado originales disponibles localmente. La iluminación, los terrenos y el movimiento son una escena propia: no ejecuta el motor de SnowRunner, no calcula agarre ni reproduce su física. Los selectores del visor son de previsualización; los parámetros editables se guardan únicamente con **Guardar**. No se simulan cambios visibles de motor. Se muestra el chasis con los accesorios predeterminados del XML, no los accesorios ni la pintura de una partida guardada. Los modelos compilados personalizados de mods todavía usan su carátula. Las bibliotecas conservan miniaturas representativas para neumáticos y remolques; el modelo original se carga dentro del editor.

Las reglas de materiales y cabinas siguen la documentación oficial de Saber: [Material](https://expeditions-guides.saber.games/truck_modding/tags_and_attributes_of_trucks/combinexmesh/material/), [Truck meshes](https://expeditions-guides.saber.games/truck_modding/general_info/fbx_file_structure/truck_meshes/) y [Special meshes](https://expeditions-guides.saber.games/truck_modding/general_info/fbx_file_structure/special_meshes/). Para comprobar cada vehículo y remolque instalado en la aplicación, ejecutar `$env:SNOWRUNNER_ALL_MODELS='1'; node scripts/test-library-ui.mjs` después de generar el ejecutable.

En la instalación comprobada se verificó la lectura de 184 modelos distintos del catálogo. Los archivos extraídos permanecen en la caché local `game-models`; no entran en GitHub ni en el instalador.

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
