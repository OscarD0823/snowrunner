<template>
  <div class="game-folder">
    <Button
      class="source-option"
      type="primary"
      size="large"
      @click="onFolderClick"
    >
      <template #icon>
        <FolderFilled />
      </template>
      <span class="option-copy">
        <strong>{{ texts.folderOptionTitle }}</strong>
        <small>{{ texts.folderOptionDescription }}</small>
      </span>
    </Button>
    <Button
      class="source-option secondary"
      size="large"
      @click="onFileClick"
    >
      <template #icon>
        <FileFilled />
      </template>
      <span class="option-copy">
        <strong>{{ texts.fileOptionTitle }}</strong>
        <small>{{ texts.fileOptionDescription }}</small>
      </span>
    </Button>
  </div>
</template>

<script lang='ts' setup>
import { FileFilled, FolderFilled } from '@ant-design/icons-vue'
import type { IDir, IFile } from '@modules/files/types'
import { di } from '@utilities/di/container'
import { DIALOGS_TOKEN, DIRS_TOKEN, FILES_TOKEN, MESSAGES_TOKEN } from '@utilities/di/renderer/tokens'
import { Button } from 'ant-design-vue'
import { SETUP_LOCALIZATION as texts } from './localization'

const files = di.resolve(FILES_TOKEN)
const dialogs = di.resolve(DIALOGS_TOKEN)
const messages = di.resolve(MESSAGES_TOKEN)

const file = defineModel<IFile | undefined>({default: undefined})

async function onFolderClick() {
	const selected = await getFromFolder()

	if (selected) {
		file.value = selected
	}
}

async function onFileClick() {
	const selected = await getInitialPak()

	if (selected) {
		file.value = selected
	}
}

async function getInitialPak(): Promise<IFile | undefined> {
	const selectedPath = dialogs.getInitial()

	if (!selectedPath) {
		return
	}

	const selectedFile = files.newFile(selectedPath)

	if (selectedFile.basename() !== 'initial.pak' || !await selectedFile.exists()) {
		messages.error(texts.invalidInitialError)

		return
	}

	return selectedFile
}

async function getFromFolder(): Promise<IFile | undefined> {
	const selectedPath = dialogs.getDir()

	if (!selectedPath) {
		messages.error(texts.invalidFolderError)

		return
	}

	const dirs = di.resolve(DIRS_TOKEN)
	const found = await findInitial(dirs.newDir(selectedPath))

	if (!found) {
		messages.error(texts.invalidFolderError)

		return
	}

	return found
}

async function findInitial(dir: IDir): Promise<IFile | undefined> {
	const parts = ['steamapps', 'common', 'SnowRunner', 'en_us', 'preload', 'paks', 'client', 'initial.pak']
	const len = parts.length

	for (let i = 0; i < len; i++) {
		const file = dir.file(...parts)
		
		if (await file.exists()) {
			return file
		}
		
		parts.shift()
	}
}
</script>

<style lang='scss' scoped>
.game-folder {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14px;
	margin-top: 10px;

	.source-option {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		height: auto;
		min-height: 72px;
		padding: 12px 16px;
		text-align: left;
		white-space: normal;

		&.secondary {
			background: white;
			border-color: #cbd5e1;
			color: #334155;

			&:hover {
				background: #fff7ed !important;
				border-color: #f97316 !important;
				color: #c2410c !important;
			}
		}
	}

	.option-copy {
		display: flex;
		flex-direction: column;
		margin-left: 6px;
		line-height: 1.3;

		strong {
			font-size: 14px;
		}

		small {
			margin-top: 4px;
			opacity: 0.76;
			font-size: 11px;
		}
	}

	@media (max-width: 680px) {
		grid-template-columns: 1fr;
	}
}
</style>
