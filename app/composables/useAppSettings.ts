import { fetchAppSettings } from '~/services/app-setting.service'
import type { AppSettings } from '~/types/app-setting'

/**
 * Admin-editable wording, shared by every page that shows it.
 *
 * Held in useState so the whole app reads one copy and a change lands
 * everywhere at once. The defaults here match the server's, so a screen
 * renders sensibly in the moment before the first load returns rather than
 * flashing blank labels.
 */
const DEFAULTS: AppSettings = {
  'bin.label.full': 'Rak Kosong Ready',
  'bin.label.empty': 'Rak Kosong Belum Ready',
  'bin.label.finishGood': 'Finish Good Ready',
}

export function useAppSettings() {
  const settings = useState<AppSettings>('app-settings', () => ({ ...DEFAULTS }))
  const loaded = useState<boolean>('app-settings-loaded', () => false)

  async function load(options: { force?: boolean } = {}) {
    if (loaded.value && !options.force) return
    try {
      settings.value = { ...DEFAULTS, ...(await fetchAppSettings()) }
      loaded.value = true
    } catch {
      // Non-fatal — the defaults above keep every label readable.
    }
  }

  /**
   * The word for a bin.
   *
   * Finished goods are checked first: RCS reports that node as EMPTY,
   * because its "full" means an empty rack is waiting to be collected and
   * these are not that. Reading the status alone would call a node loaded
   * with finished goods "not ready" — the opposite of the truth.
   */
  function binLabel(
    status: 'FULL' | 'EMPTY' | null | undefined,
    hasFinishGood = false,
  ): string {
    if (hasFinishGood) return settings.value['bin.label.finishGood']
    if (status === 'FULL') return settings.value['bin.label.full']
    if (status === 'EMPTY') return settings.value['bin.label.empty']
    return '—'
  }

  return { settings, load, binLabel }
}
