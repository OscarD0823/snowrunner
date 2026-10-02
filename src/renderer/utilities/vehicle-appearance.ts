import type { InjectionKey } from 'vue'
export type VehiclePreviewContext = 'wheels' | 'suspensions' | undefined
export const VEHICLE_APPEARANCE: InjectionKey<{ tire(mesh: string): void; suspension(name: string): void }> = Symbol('vehicle-appearance')
