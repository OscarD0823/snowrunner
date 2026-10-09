# Guía de uso · SnowRunner Studio

[Portada](../README.md) · [Documentación](README.md) · [Última descarga](https://github.com/OscarD0823/snowrunner/releases/latest)

## Primer inicio

1. Instala **SnowRunner.Studio.Setup.exe** desde la última versión publicada para Windows x64.
2. Elige el idioma y selecciona la instalación de SnowRunner. El asistente explica cómo localizar `initial.pak`.
3. Deja que cargue la biblioteca. Después de una actualización o un mod, usa **Buscar contenido nuevo**.
4. Cierra el juego y conserva una copia de tu partida antes de guardar modificaciones.

SnowRunner Studio modifica configuraciones XML de `initial.pak`. No incluye SnowRunner ni sustituye su instalación.

## Bibliotecas y componentes

Vehículos y remolques tienen apartados separados. Motores, neumáticos y cabrestantes disponen de bibliotecas propias con sus variantes, compatibilidades y explicaciones.

Usa los filtros para contenido base, DLC y mods, o las vistas de favoritos y modificados. Los nombres proceden de los textos locales del juego; si falta una cadena en el idioma seleccionado, se muestra el nombre inglés.

## Editor

El vehículo permanece visible junto a los ajustes, con desplazamiento independiente y adaptación al dividir la pantalla. Cada parámetro muestra su explicación, original y recomendaciones **Poco / Medio / Alto** donde están disponibles.

El selector visual de neumáticos o suspensión aparece al editar ese tipo de componente. Es una previsualización: no guarda automáticamente ni cambia el modelo por modificar un motor o cabrestante.

Solo **Guardar** aplica los parámetros editados. Las recomendaciones son precauciones; no garantizan estabilidad para todo vehículo, mod o situación. Prueba los cambios gradualmente.

## Modelos e imágenes

- Las carátulas oficiales se extraen localmente de `gfx.pak`; una búsqueda de contenido nuevo comprueba y renueva su caché.
- Los modelos originales compatibles se leen de `shared.pak` y `editor.pak`, con ruedas y accesorios predeterminados definidos en los XML.
- Las miniaturas de neumáticos y algunas familias de remolques son representativas. El modelo original compatible se carga dentro del editor.
- Los mods pueden usar su miniatura incluida; los modelos compilados no compatibles conservan la carátula.
- Si un remolque no tiene imagen compatible, puedes asociar una PNG, JPEG o WebP local desde su menú contextual.

El visor no ejecuta el motor ni la física del juego. La escena animada, iluminación y terrenos son propios; no calcula agarre ni reproduce todos los materiales o animaciones. Usa los accesorios predeterminados y el primer esquema de pintura compatible, no los elegidos en una partida.

Puedes pausar, encuadrar y cambiar el terreno sin que eso guarde parámetros. La animación respeta la preferencia de movimiento reducido.

## Copias y restauración

Antes de editar el paquete se crea una copia de seguridad de `initial.pak`. Conserva ese respaldo y una copia independiente de tu partida. Las acciones de restablecer valores, importar y exportar permanecen disponibles en el editor.

Una actualización del juego puede reemplazar archivos o cambiar formatos: vuelve a buscar contenido y comprueba los valores originales antes de reaplicar modificaciones. No sustituyas a ciegas el paquete de una versión nueva por uno antiguo.

## Actualizaciones y soporte

La distribución es exclusiva de GitHub. Abre **Actualizaciones** con el botón ↻ de la cabecera (también desde Ajustes o Ayuda) y pulsa **Buscar actualizaciones** cuando quieras. No se consulta GitHub ni se descarga nada automáticamente.

Si hay una versión estable nueva, puedes **Descargar instalador**, leer la versión en GitHub o **Seguir con esta versión**. La descarga abre el navegador: no ejecuta el instalador ni cierra el editor. Guarda tus cambios y cierra el editor antes de ejecutar el instalador descargado. El instalador no distribuye modelos, texturas ni carátulas del juego.

Para informar de un problema, usa las [incidencias del repositorio](https://github.com/OscarD0823/snowrunner/issues). Indica la versión del programa, el vehículo o componente y el mensaje de error. No publiques partidas, datos personales ni paquetes completos del juego.

Consulta también los [avisos de privacidad](../PRIVACY.md).
