# SnowRunner Studio

SnowRunner Studio is a multilingual visual editor for SnowRunner vehicles, trailers, and components. It keeps trucks and trailers in separate libraries, explains editable values, creates backups, and writes changes back to `initial.pak`.

Version `2.0.1` also extracts official vehicle shop cards from the locally installed `gfx.pak`. Mission trailers without an official `UiIcon328x458` can be assigned a local PNG, JPEG, or WebP image from their context menu. Mod thumbnails are detected from the mod package when available.

## Development

Requires Node.js 22 and Windows x64.

```powershell
npm ci
npm run check
npm start
```

Build the Windows installer with:

```powershell
npm run make
```

The generated Squirrel installer and update artifacts are written to `out/make/squirrel.windows/x64`.

## License and notices

The application has its own identity and user interface. Third-party license notices required by the MIT-licensed foundation remain in `LICENSE` and `NOTICE.md`.

SnowRunner is a trademark of its respective owners. This project is not affiliated with Saber Interactive or Focus Entertainment.
