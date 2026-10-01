import type { IStringAttrDescriptor, XmlElement, XmlValue } from '../../attributes'
import { stringAttr } from '../../attributes'
import { BaseUiDesc } from '../../base/ui-desc'
import { innerElement } from '../../xml-with-templates'

/** Блок UI. */
export class TruckUiDesc extends BaseUiDesc {
	/** Información visible, sin modificar la estructura regional del archivo. */
	get displayName() { return this.UiName ?? this.DefaultRegion?.UiName }
	get displayDescription() { return this.UiDesc ?? this.DefaultRegion?.UiDesc }
	get displayIcon() { return this.UiIcon328x458 ?? this.DefaultRegion?.UiIcon328x458 }
	/** Реалистичная фотография-скриншот из игры с машиной в выгодном ракурсе. */
	@stringAttr()
	accessor UiIcon328x458: XmlValue<string>
	declare $UiIcon328x458: IStringAttrDescriptor

	/** Блок UI для региона. */
	@innerElement(() => TruckUiDesc, 'region\\:default')
	readonly DefaultRegion: XmlElement<TruckUiDesc>
}
