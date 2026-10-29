/** Keys an admin can change. Mirrors app-setting.keys.ts on the server. */
export interface AppSettings {
  'bin.label.full': string
  'bin.label.empty': string
  'bin.label.finishGood': string
}

export type AppSettingKey = keyof AppSettings
