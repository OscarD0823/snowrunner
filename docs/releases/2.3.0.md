# SnowRunner Studio 2.3.0

- Nueva escena original de inicio: el camión sale del logo llevando el nombre del programa y recorre nieve, rocas y barro hacia la zona de idioma. Se respeta la preferencia de movimiento reducido.
- Corregida la lectura regional de los Ford CLT9000 y F 750. Su carátula aparece tanto en el catálogo como dentro del editor.
- Los remolques tienen su propia biblioteca y su editor específico. Si el juego no proporciona una carátula se muestra una vista representativa 3D de la familia, no una fotografía real.
- Motores, neumáticos y cabrestantes muestran variantes, modelos compatibles y explicaciones visibles en español. Se advierte cuando un archivo es compartido entre varios vehículos.
- Vistas de neumáticos renderizadas en 3D usando proporciones del XML y un dibujo representativo. No se extraen ni distribuyen modelos originales del juego; los cambios de agarre no alteran la miniatura.
- Recuperación de los 13 idiomas del juego: las cachés antiguas incorporan los textos faltantes sin sobrescribir XML editados. Se corrige también la selección de idioma para mods.
- Las actualizaciones de configuración conservan la carpeta de trabajo. Cambiar de biblioteca limpia los filtros que podían ocultar su contenido.
- Corregida la separación entre el botón Volver y el título del editor, y eliminadas peticiones a carátulas antiguas que ya no se incluyen en el paquete.

## Verificación

Se comprobaron 118 camiones, ambos Ford con su imagen y editor, 68 remolques, 66 archivos de motores, 166 conjuntos editables de neumáticos y 5 archivos de cabrestantes. Las pruebas de interfaz comprobaron campos de edición visibles y cero peticiones fallidas de imágenes. El asistente se comprobó a 600×520, 960×620 y 1366×768, con los 13 idiomas y sin desbordamiento horizontal. La migración de textos se comprobó conservando una edición XML de prueba.

El instalador EXE no tiene firma comercial. El MSIX local es una compilación de desarrollo con certificado de prueba: no equivale a aprobación de Microsoft Store. La entrega a la tienda requiere la identidad y el editor exactos de Partner Center.
