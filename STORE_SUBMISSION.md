# Preparación para Microsoft Store

> Documento histórico. Desde la versión 2.4.0 se distribuye únicamente en GitHub; los comandos MSIX ya no están activos.

La variante de tienda se publica como **Offroad XML Studio**. El nombre evita presentar la aplicación como un producto oficial; la ficha debe usar “compatible con SnowRunner” únicamente como explicación de interoperabilidad.

## Lo que ya está preparado

- paquete MSIX x64 sin elevación ni escritura dentro de la carpeta de instalación;
- actualizaciones de GitHub/Squirrel desactivadas cuando Electron detecta Microsoft Store;
- identidad visual propia y recursos MSIX originales;
- carátulas del juego excluidas del paquete; se extraen localmente desde la instalación legítima del usuario;
- WinRAR y otros ejecutables de archivado eliminados; los ZIP se procesan localmente con una biblioteca MIT integrada;
- política de privacidad local en `PRIVACY.md`;
- descripción y aviso de no afiliación para la ficha.

## Datos que deben copiarse desde Partner Center

En **Identidad del producto** copia exactamente:

- `Package/Identity/Name` a `MSIX_IDENTITY_NAME`;
- `Package/Identity/Publisher` a `MSIX_PUBLISHER`;
- el nombre público del editor a `MSIX_PUBLISHER_DISPLAY_NAME`.

PowerShell:

```powershell
$env:MSIX_IDENTITY_NAME='valor exacto de Partner Center'
$env:MSIX_PUBLISHER='CN=valor exacto de Partner Center'
$env:MSIX_PUBLISHER_DISPLAY_NAME='nombre público del editor'
npm run build:store
```

El archivo para subir queda en `out/make/msix/x64/SnowRunner Studio.msix`. La compilación final queda sin firma local para que Microsoft Store la firme después de certificarla. Para una prueba local con certificado de desarrollo usa `npm run build:msix`.

## Texto recomendado para la ficha

Editor local no oficial para personalizar parámetros XML compatibles con SnowRunner. Organiza camiones, remolques, motores, neumáticos y cabrestantes; crea copias de seguridad antes de guardar y no descarga ni incluye recursos del juego.

Aviso: requiere una instalación legítima y compatible del juego. SnowRunner es una marca de sus respectivos titulares. Offroad XML Studio no está afiliado, respaldado ni patrocinado por Saber Interactive o Focus Entertainment.

No usar logotipos, capturas, carátulas ni nombres de vehículos del juego en los recursos de la ficha sin autorización expresa de sus titulares.
