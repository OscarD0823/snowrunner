<p align="center">
  <img src="src/images/app-icon.png" alt="SnowRunner Studio logo" width="96" />
</p>

<h1 align="center">SnowRunner Studio</h1>

<p align="center">Prepare your expedition. A visual editor for SnowRunner vehicles, trailers and components.</p>

<p align="center">
  <a href="https://github.com/OscarD0823/snowrunner/releases/latest"><strong>Download for Windows</strong></a> ·
  <a href="docs/user-guide.md">User guide (Spanish)</a> ·
  <a href="CHANGELOG.md">Release history</a> ·
  <a href="README.md">Español</a>
</p>

## Install

Open **Assets** on the [latest release](https://github.com/OscarD0823/snowrunner/releases/latest) and download **SnowRunner.Studio.Setup.exe**. Requires Windows x64 and a local SnowRunner installation; Node.js is only needed for development. Updates are distributed through GitHub, not Microsoft Store.

**Optional updates:** use ↻ to check for a new release, download it in your browser or keep the current version. Nothing is downloaded or installed automatically.

## Features

- Independent libraries for vehicles, trailers, engines, tires and winches.
- Base-game, DLC and mod filters, favorites, modified items and content rescanning.
- Explained settings, original values, three recommendation levels and `initial.pak` backups.
- A persistent vehicle preview beside the settings, including split-screen layouts.
- Compatible tire and suspension previews shown when editing those components.
- Local game images, supported mod thumbnails and manually assigned images where needed.
- An animated snow, mud, forest and rock scene with pause and reduced-motion support.

The interface offers SnowRunner's 13 languages. Names come from local game strings, with English fallback where a translation is missing.

## Safety and limitations

Close the game and keep your backups. Only **Save** applies edited parameters; preview selections never save automatically. Recommendations cannot guarantee stability for every vehicle, mod or situation.

The preview is a custom scene, not SnowRunner's engine or physics. It uses compatible local models, default attachments and the first available paint scheme, not your save-game customization. Some library thumbnails are representative; unsupported mod models retain their cover image.

See the [documentation index](docs/README.md), [development guide](docs/development.md), [release history](CHANGELOG.md) and [privacy notice](PRIVACY.md).

## Author and license

Edition, interface and workflow by [@OscarD0823](https://github.com/OscarD0823). Companion project: [RoadCraft Studio](https://github.com/OscarD0823/roadcraft).

[MIT license](LICENSE), with required [third-party notices](NOTICE.md) and [licenses](THIRD_PARTY_NOTICES.md) retained. Unofficial tool, not affiliated with Saber Interactive or Focus Entertainment. Game resources are read from the user's local installation and are not redistributed.
