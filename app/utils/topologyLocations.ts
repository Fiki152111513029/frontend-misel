// Mirrors backend/src/modules/factory-maps/utils/topology-locations.ts: RCS's
// topology export lists map nodes in `nodeArr`, columns named by `nodeKeys`.
// Only type 1 (rack), 6 (charger) and 7 (parking) nodes carry a location we
// track. The backend re-reads the uploaded file itself when importing, so
// this is only for previewing what will be created.
export const TOPOLOGY_NODE_TYPE = { RACK: 1, CHARGER: 6, PARKING: 7 } as const

export interface TopologyLocation {
  code: string
  name: string
}

export interface TopologyLocations {
  chargers: TopologyLocation[]
  parkings: TopologyLocation[]
  racks: TopologyLocation[]
}

// Throws if the file isn't JSON at all; a JSON file without nodes just
// yields empty lists.
export async function parseTopologyLocations(file: File): Promise<TopologyLocations> {
  const raw = JSON.parse(await file.text()) as { nodeArr?: unknown, nodeKeys?: unknown } | null
  const result: TopologyLocations = { chargers: [], parkings: [], racks: [] }
  if (!raw || !Array.isArray(raw.nodeArr) || !Array.isArray(raw.nodeKeys)) return result

  const typeIndex = raw.nodeKeys.indexOf('type')
  const contentIndex = raw.nodeKeys.indexOf('content')
  const nameIndex = raw.nodeKeys.indexOf('name')
  if (typeIndex < 0 || contentIndex < 0) return result

  const buckets = new Map<number, { list: TopologyLocation[], seen: Set<string> }>([
    [TOPOLOGY_NODE_TYPE.CHARGER, { list: result.chargers, seen: new Set() }],
    [TOPOLOGY_NODE_TYPE.PARKING, { list: result.parkings, seen: new Set() }],
    [TOPOLOGY_NODE_TYPE.RACK, { list: result.racks, seen: new Set() }],
  ])

  for (const node of raw.nodeArr as unknown[]) {
    if (!Array.isArray(node)) continue
    const bucket = buckets.get(Number(node[typeIndex]))
    if (!bucket) continue
    const code = String(node[contentIndex] ?? '').trim()
    if (!code || bucket.seen.has(code)) continue
    bucket.seen.add(code)
    const name = nameIndex >= 0 ? String(node[nameIndex] ?? '').trim() : ''
    bucket.list.push({ code, name: name || code })
  }
  return result
}
