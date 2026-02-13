export const RAW_MATERIAL_TYPES = [
  'Ossos',
  'Vísceras',
  'VISCERAS DE PEIXE',
  'MUXIBA',
  'Sangue',
  'Misto',
  'Despojo',
  'Barrigada',
  'COURO BOVINO',
  'Óleo Saturado',
] as const

export const MEASUREMENT_UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'L', label: 'Litros' },
  { value: 'un', label: 'Unidades' },
  { value: 'ton', label: 'Toneladas' },
  { value: 'bag', label: 'Bag (1400kg)' },
] as const

export type RawMaterialType = (typeof RAW_MATERIAL_TYPES)[number]
