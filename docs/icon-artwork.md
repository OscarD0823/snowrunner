# Icono de vehículo · SnowRunner Studio

[Documentación](README.md) · [Portada](../README.md)

![Icono de SnowRunner Studio](../src/images/app-icon.png)

## Diseño y procedencia

Basado en la dirección visual de la portada «Proyectos de Oscar»: camión de expedición de seis ruedas, azul marino y naranja, con nieve en los neumáticos.
El emblema anterior está integrado en el panel lateral del camión; el vehículo completo es el icono, sin un cuadro externo.
Son ilustraciones conceptuales originales generadas con la herramienta integrada ImageGen, no modelos extraídos ni vehículos oficiales del juego.

El maestro PNG con transparencia real se guarda en [app-icon-master.png](../src/images/app-icon-master.png).
El [emblema de referencia](../src/images/app-emblem.png) se conserva para documentar la identidad.
La ilustración se usa en la cabecera, la animación de inicio, la ventana y el instalador.

## Exportación reproducible

```powershell
npm run icons:generate
npm run test:icons
node scripts/test-packaged-icons.mjs
```

No se regenera la ilustración ni se hace ninguna petición de IA: el script convierte el maestro con Electron, conserva el canal alfa y añade un margen de seguridad del 5% por lado.
Se generan PNG de 512 px e ICO con 16, 24, 32, 48, 64, 128 y 256 px. También mantiene coherentes los tres PNG históricos de Store, aunque la distribución activa es solo GitHub.
El comprobador verifica tamaños, transparencia, integridad del ICO y coincidencia exacta con el maestro.
Tras compilar, la prueba del paquete verifica que los siete recursos estén realmente incrustados en el EXE y el instalador, y que el icono de la ventana se incluya en los archivos distribuidos.
Las pruebas de interfaz comprueban el hash del PNG realmente cargado y capturan los siete tamaños sobre fondo claro y oscuro.

## Prompt final

Modo: herramienta integrada ImageGen; una composición por proyecto, sin API/CLI alternativo.

Referencias locales al generar: ilustración del vehículo de la portada y emblema anterior del proyecto.
Ambas se inspeccionaron antes de la composición; el vehículo es la referencia visual y el emblema es el elemento insertado.

```text
Use case: compositing.
Asset type: finished square Windows application icon, SnowRunner Studio.
Input images: Image 1 is the expedition truck from the user's project portal, vehicle identity and rendering reference. Image 2 is the existing SnowRunner Studio emblem, to be integrated as a painted/enameled marking ON the vehicle, not a floating badge.
Primary request: turn the vehicle into a polished app icon and incorporate the full orange tire-ring, snowy mountain and winding-road emblem into the visible large side panel of the truck, following the perspective of the metal panel. Keep the truck navy and burnt orange, six-wheel expedition body, snowy rugged tires, roof equipment, realistic physical geometry. The emblem should be clearly recognizable at large sizes as part of the vehicle livery.
Composition: ONE centered complete truck, compact three-quarter view facing right, square canvas, occupying roughly 90% of canvas width and 78% height, enough safe margin around all wheels and roof. Icon-readable strong silhouette and slightly simplified surfaces. No framed tile: the truck itself IS the icon.
Lighting: crisp cool rim light, clear navy panels and warm orange highlights with good separation on light AND dark desktops.
Background: genuinely transparent alpha; no scenery, ground, halo, glow cloud, gradient, rectangular background or shadow beyond the silhouette.
Constraints: retain reference vehicle design and emblem geometry; no text, lettering, manufacturer insignia, watermarks, extra objects, floating badges or disconnected logo. This is original conceptual illustration, not an extracted official game model.
```

