// Peta pabrik 3D (Three.js). Dibuat sebagai modul murni supaya bisa dipakai
// komponen Vue mana pun: createFactoryMap3D(container, opsi) -> { ..., dispose }

import * as THREE from 'three'
import { RoundedBoxGeometry } from
  'three/addons/geometries/RoundedBoxGeometry.js'
import { GLTFLoader } from
  'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from
  'three/addons/loaders/DRACOLoader.js'
import { OrbitControls } from
  'three/addons/controls/OrbitControls.js'

// Cache GLB di tingkat modul, bukan per instance mesin. Model yang sama
// dipakai lagi setiap kali peta dibuka atau map diganti; tanpa cache,
// ketiganya diunduh dan diurai ulang tiap kali — itu penyumbang terbesar
// jeda sebelum peta tampil. Yang disimpan hasil urai mentahnya; tiap
// pemakai meng-clone lalu menskalakan sendiri, supaya dua map dengan skala
// berbeda tidak saling mengubah.
const gltfCache = new Map()

/**
 * clone() ikut membawa geometry dan material yang SAMA dengan aslinya, jadi
 * membuangnya saat dispose() akan merusak salinan di cache — ganti map
 * berikutnya lalu tampil tanpa model. Tandai supaya dispose melewatinya.
 */
/**
 * Apakah telemetri menyatakan robot sedang membawa sesuatu. RCS mengisi
 * payLoad dengan bentuk yang tidak seragam, jadi yang diperiksa adalah
 * nilai-nilai yang berarti "tidak membawa", bukan sebaliknya.
 */
function hasPayload(payload) {
  if (payload == null) return false
  const v = String(payload).trim().toLowerCase()
  return v !== '' && v !== '0' && v !== 'none' && v !== 'null' && v !== 'false'
}

function markShared(root) {
  root.traverse((o) => {
    o.userData.sharedWithCache = true
  })
}

function loadGltfCached(loader, url) {
  let entry = gltfCache.get(url)
  if (!entry) {
    entry = loader.loadAsync(url)
    gltfCache.set(url, entry)
    // Kegagalan jangan ikut tersimpan, supaya percobaan berikutnya tidak
    // langsung memakai promise yang sudah ditolak.
    entry.catch(() => gltfCache.delete(url))
  }
  return entry
}

// Konstanta ukuran model (mm) ada di bawah; ubah sesuai kebutuhan.
/**
 * @param topologyUrl Topologi yang digambar. Defaultnya berkas statis di
 *   baseUrl, tapi Factory Map di database memakai bentuk JSON yang sama
 *   persis (allPath / chargeCoor / nodeArr / nodeKeys), jadi cukup berikan
 *   topologyUrl milik map tersebut. Model GLB dan decoder Draco tetap
 *   diambil dari baseUrl karena bukan bagian dari data map.
 */
export function createFactoryMap3D(
  container,
  { baseUrl = '/factory-3d', topologyUrl, onError, onReady } = {}
) {
  // 1. Ambil container HTML

  // 2. Buat scene
  const scene = new THREE.Scene()
  // Deliberately not the same colour as the container div: if the two
  // match, a renderer drawing an empty scene looks exactly like a renderer
  // that never started, and there is no way to tell them apart on screen.
  scene.background = new THREE.Color('#dde6f0')

  // 3. Buat kamera
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )

  camera.position.set(24, 24, 30)

  // 4. Buat renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  })

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  )

  renderer.setSize(
    container.clientWidth,
    container.clientHeight,
    false
  )

  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Kanvas mengisi container lewat CSS (tidak memengaruhi ukuran layout)
  Object.assign(renderer.domElement.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block'
  })
  container.appendChild(renderer.domElement)

  // 5. Tambahkan pencahayaan
  const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0x94a3b8,
    1.4
  )

  scene.add(ambientLight)

  const sun = new THREE.DirectionalLight(
    0xffffff,
    2.8
  )

  sun.position.set(15, 25, 10)
  sun.castShadow = true

  // Area bayangan menutup seluruh lantai (bawaan Three.js hanya +-5 unit,
  // sehingga banyak objek tanpa bayangan terlihat mengambang)
  sun.shadow.camera.left = -26
  sun.shadow.camera.right = 26
  sun.shadow.camera.top = 20
  sun.shadow.camera.bottom = -20
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 80
  sun.shadow.mapSize.set(4096, 4096)
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.02
  scene.add(sun)

  // 6. Buat lantai gudang
  const floorGeometry = new THREE.BoxGeometry(
    40, 0.3, 28
  )

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: '#dce5ed',
    roughness: 0.9,
    side: THREE.DoubleSide
  })

  const floor = new THREE.Mesh(
    floorGeometry,
    floorMaterial
  )

  floor.position.y = -0.15
  floor.receiveShadow = true
  scene.add(floor)

  // Jalur dari topologi workshop (public/workshop.json)
  const pathGroup = new THREE.Group()
  scene.add(pathGroup)

  // ---- Lapisan realtime --------------------------------------------------
  // Robot sungguhan dan status bin, sumbernya sama persis dengan peta 2D di
  // Dashboard. Semuanya hidup di grup terpisah supaya adegan simulasi di
  // bawah tidak perlu tahu apa-apa soal ini.
  //
  // toWorldLive baru terisi setelah topologi dimuat, karena setiap
  // penempatan butuh transform koordinatnya. Data yang datang lebih dulu
  // ditahan di pending* lalu dipasang sekali topologi siap.
  const liveGroup = new THREE.Group()
  scene.add(liveGroup)
  let toWorldLive = null
  const rackSlotByName = new Map()
  // Prototipe rak dari topologi, dipakai ulang untuk rak yang sedang
  // diangkat AMR. Baru terisi setelah model GLB selesai dimuat.
  let rackPrototype = null
  const liveRobots = new Map()
  const binMarkers = new Map()
  let pendingRobots = null
  let pendingBins = null

  // Jarak antar pembacaan diukur, bukan dipatok. Dulu nilainya tetap, dan
  // itu yang membuat robot bergerak seperti slow motion: begitu laporan
  // RCS tiba lebih cepat daripada durasi tween, tiap pembaruan mengulang
  // animasi yang belum mendekati tujuannya, sehingga marker hanya menempuh
  // sebagian kecil tiap segmen dan makin lama makin tertinggal.
  const UPDATE_FALLBACK_MS = 800
  const MIN_TWEEN_MS = 150
  const MAX_TWEEN_MS = 3000
  // Dihaluskan supaya satu paket terlambat tidak memanjangkan tween
  // berikutnya dan membuat robot merayap.
  const INTERVAL_SMOOTHING = 0.3
  let observedUpdateMs = UPDATE_FALLBACK_MS
  let lastUpdateAt = 0

  function tweenDuration(now) {
    if (lastUpdateAt > 0) {
      const gap = now - lastUpdateAt
      // Jeda tak masuk akal (tab di latar belakang, socket menyambung
      // ulang) diabaikan daripada merusak rata-ratanya.
      if (gap > 0 && gap < MAX_TWEEN_MS * 2) {
        observedUpdateMs =
          observedUpdateMs * (1 - INTERVAL_SMOOTHING) + gap * INTERVAL_SMOOTHING
      }
    }
    lastUpdateAt = now
    return Math.min(MAX_TWEEN_MS, Math.max(MIN_TWEEN_MS, observedUpdateMs * 1.1))
  }

  // GLB ini terkompresi Draco -> butuh decoder (public/draco)
  const dracoLoader = new DRACOLoader().setDecoderPath(`${baseUrl}/draco/`)
  const gltfLoader = new GLTFLoader().setDRACOLoader(dracoLoader)

  // Ukuran sisi terpanjang model di dunia nyata (mm) -> ubah sesuai kebutuhan
  const CHARGER_SIZE_MM = 550
  const RACK_SIZE_MM = 2400
  const RACK_YAW_OFFSET = 0      // jika rak terbalik (horizontal/vertikal), isi Math.PI / 2
  const ARM_SIZE_MM = 2500       // sisi terpanjang (x/z) arm_robot.glb -> makin besar makin tinggi
  const ARM_BEHIND_MM = 1800     // jarak lengan robot di belakang node rak
  const ARM_SWING = 0.9          // sudut sapuan lengan (radian)
  const ARM_YAW_OFFSET = 0       // putar arah hadap lengan (radian) jika terbalik

  // Muat GLB, skala otomatis agar sisi terpanjang (x/z) = targetSize,
  // dipusatkan di x/z dan bagian bawah menapak lantai (y = 0)
  async function loadModel(url, targetSize) {
    const gltf = await loadGltfCached(gltfLoader, url)
    const inner = gltf.scene.clone(true)
    markShared(inner)
    const box = new THREE.Box3().setFromObject(inner)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    inner.position.set(-center.x, -box.min.y, -center.z)
    inner.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })

    const wrapper = new THREE.Group()
    wrapper.add(inner)
    wrapper.scale.setScalar(targetSize / Math.max(size.x, size.z))
    return wrapper
  }

  // arm_robot.glb: satu mesh kaku, jadi dipotong di ketinggian ARM_SPLIT.
  // Bagian atas (lengan mendatar) diputar di sumbu tiang -> lengan bisa menyapu.
  const ARM_SPLIT = 0.78 // 0 = dasar, 1 = puncak model (fraksi tinggi)

  async function loadArm(url, targetSize) {
    const gltf = await loadGltfCached(gltfLoader, url)
    const root = gltf.scene.clone(true)
    markShared(root)
    root.updateMatrixWorld(true)

    let mesh = null
    root.traverse((o) => {
      if (o.isMesh && !mesh) mesh = o
    })
    if (!mesh) throw new Error('arm_robot.glb: mesh tidak ditemukan')

    const geo = mesh.geometry
    const pos = geo.attributes.position
    geo.computeBoundingBox()
    const { min, max } = geo.boundingBox
    const ySplit = min.y + (max.y - min.y) * ARM_SPLIT

    const index = geo.index
      ? Array.from(geo.index.array)
      : Array.from({ length: pos.count }, (_, i) => i)

    // Pisahkan segitiga: pusat segitiga di atas ySplit -> bagian atas
    const lower = []
    const upper = []
    for (let i = 0; i < index.length; i += 3) {
      const cy =
        (pos.getY(index[i]) + pos.getY(index[i + 1]) + pos.getY(index[i + 2])) / 3
      const target = cy > ySplit ? upper : lower
      target.push(index[i], index[i + 1], index[i + 2])
    }

    // Sumbu tiang = rata-rata x/z titik sedikit di bawah potongan
    let sx = 0
    let sz = 0
    let n = 0
    const band = (max.y - min.y) * 0.25
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      if (y > ySplit - band && y <= ySplit) {
        sx += pos.getX(i)
        sz += pos.getZ(i)
        n++
      }
    }
    const cx = n ? sx / n : (min.x + max.x) / 2
    const cz = n ? sz / n : (min.z + max.z) / 2

    const upperGeo = geo.clone()
    upperGeo.setIndex(upper)
    geo.setIndex(lower)

    const upperMesh = new THREE.Mesh(upperGeo, mesh.material)
    upperMesh.position.set(-cx, 0, -cz)

    const swing = new THREE.Group() // pivot berputar di sumbu tiang
    swing.name = 'armSwing'
    swing.position.set(cx, 0, cz)
    swing.add(upperMesh)
    mesh.parent.add(swing)

    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })

    // Tiang di titik (0, 0, 0), dasar menapak lantai
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    root.position.set(-cx, -box.min.y, -cz)

    const wrapper = new THREE.Group()
    wrapper.add(root)
    wrapper.scale.setScalar(targetSize / Math.max(size.x, size.z))
    return wrapper
  }

  // Updater gerakan lengan robot (dipanggil tiap frame)
  const armUpdates = []

  async function loadTopology() {
    const url = topologyUrl || `${baseUrl}/workshop.json`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status} saat mengambil topologi`)

    // A 200 does not mean JSON. An SPA fallback (`try_files ... /index.html`)
    // happily answers 200 with the app's own HTML, and res.json() would then
    // fail with a parser error that says nothing about the real cause.
    const text = await res.text()
    let topo
    try {
      topo = JSON.parse(text)
    } catch {
      const head = text.trim().slice(0, 40)
      throw new Error(
        `Respons 200 tapi bukan JSON (mulai dengan "${head}"). `
        + 'Biasanya server mengembalikan halaman HTML, bukan berkas topologi.'
      )
    }

    if (!Array.isArray(topo.allPath) || topo.allPath.length === 0) {
      throw new Error('Topologi terbaca tapi tidak punya allPath — tidak ada jalur untuk digambar')
    }

    // Skala otomatis: seluruh jalur dimuat di lebar ~36 unit lantai
    const pts = topo.allPath.flat()
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const scale = 36 / (maxX - minX)
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2

    // koordinat topologi (x, y) -> dunia 3D (x, z)
    const toWorld = (x, y, h = 0.05) =>
      new THREE.Vector3((x - cx) * scale, h, -(y - cy) * scale)

    // Segmen jalur (hilangkan duplikat arah balik)
    const seen = new Set()
    const verts = []
    // Tiap jalur bisa berisi 2+ titik (jalur lengkung) -> pecah per pasangan
    for (const poly of topo.allPath) {
      for (let i = 0; i < poly.length - 1; i++) {
        const a = poly[i]
        const b = poly[i + 1]
        const key = [a, b].sort((m, n) => m[0] - n[0] || m[1] - n[1]).join('|')
        if (seen.has(key)) continue
        seen.add(key)
        verts.push(toWorld(...a), toWorld(...b))
      }
    }

    pathGroup.add(
      new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(verts),
        new THREE.LineBasicMaterial({ color: '#f59e0b' })
      )
    )

    // Model GLB: charger di node charger (type 6), rak di node storage (type 1)
    const [chargerModel, rackModel, armModel] = await Promise.all([
      loadModel(`${baseUrl}/models/charger_amr.glb`, CHARGER_SIZE_MM * scale),
      loadModel(`${baseUrl}/models/rak_drg.glb`, RACK_SIZE_MM * scale),
      loadArm(`${baseUrl}/models/arm_robot.glb`, ARM_SIZE_MM * scale)
    ].map((p) => p.catch((err) => (console.error('Gagal memuat GLB', err), null))))

    const key = (p) => p.join(',')
    const neighbours = new Map() // titik -> titik tetangga di jalur
    for (const poly of topo.allPath) {
      for (let i = 0; i < poly.length - 1; i++) {
        for (const [a, b] of [[poly[i], poly[i + 1]], [poly[i + 1], poly[i]]]) {
          if (!neighbours.has(key(a))) neighbours.set(key(a), [])
          neighbours.get(key(a)).push(b)
        }
      }
    }

    // Node di tengah jalan (titik jalur terdekat punya >= 2 cabang) hanya
    // tempat pemindahan rak lain -> tidak diberi rak. Rak sungguhan ada di
    // ujung buntu jalur (1 cabang).
    const pathPts = [...neighbours.keys()].map((k) => k.split(',').map(Number))
    const nearestPathPoint = (x, y) => {
      let dist = Infinity
      let pt = null
      for (const q of pathPts) {
        const d = Math.hypot(q[0] - x, q[1] - y)
        if (d < dist) {
          dist = d
          pt = q
        }
      }
      return { pt, dist }
    }

    const isMiddleOfRoad = (x, y) => {
      const { pt, dist } = nearestPathPoint(x, y)
      if (dist > 400) return false
      return new Set(neighbours.get(key(pt)).map(key)).size >= 2
    }

    // Sudut rak di sebuah node: jalur vertikal -> rak vertikal, horizontal -> horizontal
    const slotYaw = (x, y) => {
      const { pt } = nearestPathPoint(x, y)
      const nb = neighbours.get(key(pt))?.[0]
      const vertical = nb
        ? Math.abs(pt[1] - nb[1]) > Math.abs(pt[0] - nb[0])
        : false
      return (vertical ? Math.PI / 2 : 0) + RACK_YAW_OFFSET
    }

    // Slot rak (tempat rak bisa berada): rak sungguhan + tempat sementara
    const slots = []
    const addSlot = (node, temp, obj) => {
      const { pt, dist } = nearestPathPoint(node.x, node.y)
      if (dist > 400) return
      slots.push({
        name: node.name,
        temp,
        obj,
        key: key(pt),
        world: toWorld(node.x, node.y, 0),
        yaw: slotYaw(node.x, node.y)
      })
    }

    const keys = topo.nodeKeys
    const chargeCoor = new Map(topo.chargeCoor)
    const dotGeo = new THREE.CircleGeometry(0.1, 16)
    dotGeo.rotateX(-Math.PI / 2)
    const dotMat = new THREE.MeshBasicMaterial({ color: '#0284c7' })
    const rackNodes = []

    for (const row of topo.nodeArr) {
      const node = Object.fromEntries(keys.map((k, i) => [k, row[i]]))
      if (node.type === 0) continue // simpang biasa

      const isCharger = node.type === 6
      // Node bernama angka = tempat sementara (di jalan), tanpa rak
      const isRack =
        node.type === 1 &&
        !/^\d+$/.test(node.name) &&
        !isMiddleOfRoad(node.x, node.y)
      if (isRack) rackNodes.push(node)
      const model = isCharger ? chargerModel : isRack ? rackModel : null

      if (model) {
        const obj = model.clone(true)
        // charger memakai koordinat & sudut dari chargeCoor
        const c = isCharger ? chargeCoor.get(node.name) : null
        obj.position.copy(toWorld(c?.x ?? node.x, c?.y ?? node.y, 0))
        if (c) obj.rotation.y = THREE.MathUtils.degToRad(c.chargeAngle)

        if (isRack) {
          obj.rotation.y = slotYaw(node.x, node.y)
          addSlot(node, false, obj)
        }
        pathGroup.add(obj)
      } else {
        // tempat sementara (tipe rak tanpa rak) juga jadi slot kosong
        if (node.type === 1) addSlot(node, true, null)
        // node tanpa model (atau model gagal dimuat) berupa titik biru
        const dot = new THREE.Mesh(dotGeo, dotMat)
        dot.position.copy(toWorld(node.x, node.y, 0.08))
        pathGroup.add(dot)
      }
    }

    // Lengan robot: 1 per pasang node rak (nama sama, beda huruf akhir,
    // misal WRL21E + WRL21F), diletakkan di belakang pasangan itu
    if (armModel) {
      const groups = new Map()
      for (const node of rackNodes) {
        const base = node.name.replace(/[A-Z]$/, '')
        if (!groups.has(base)) groups.set(base, [])
        groups.get(base).push(node)
      }

      for (const pair of groups.values()) {
        if (pair.length !== 2) continue

        // arah "belakang" = menjauh dari jalur (dari tetangga ke node)
        let ox = 0
        let oy = 0
        for (const n of pair) {
          const nb = neighbours.get(key([n.x, n.y]))?.[0]
          if (!nb) continue
          const dx = n.x - nb[0]
          const dy = n.y - nb[1]
          const len = Math.hypot(dx, dy) || 1
          ox += dx / len
          oy += dy / len
        }
        const olen = Math.hypot(ox, oy)
        if (!olen) continue
        ox /= olen
        oy /= olen

        const mx = (pair[0].x + pair[1].x) / 2
        const my = (pair[0].y + pair[1].y) / 2
        const arm = new THREE.Group()
        const body = armModel.clone(true)
        arm.add(body)
        arm.position.copy(
          toWorld(mx + ox * ARM_BEHIND_MM, my + oy * ARM_BEHIND_MM, 0)
        )
        const faceYaw = Math.atan2(-oy, -ox) + ARM_YAW_OFFSET
        arm.rotation.y = faceYaw

        // lengan atas menyapu kiri-kanan (berhenti sebentar di tiap ujung)
        const swing = body.getObjectByName('armSwing')
        const phase = armUpdates.length * 1.7
        armUpdates.push((time) => {
          const w = ((time + phase) * Math.PI * 2) / 8 // 1 siklus = 8 detik
          const k = Math.sin(w)
          swing.rotation.y = ARM_SWING * Math.sign(k) * Math.pow(Math.abs(k), 0.6)
        })
        pathGroup.add(arm)
      }
    }

    // Dari sini lapisan realtime punya semua yang dibutuhkan.
    toWorldLive = toWorld
    rackPrototype = rackModel
    // Robot yang sudah terdaftar mungkin sedang membawa rak tapi belum bisa
    // digambar karena modelnya belum ada — pasang sekarang.
    if (pendingRobots) setRobots(pendingRobots)
    onReady?.({
      nodes: (topo.nodeArr || []).length,
      paths: (topo.allPath || []).length,
      racks: slots.length,
      // Lebar dunia selalu dinormalkan ke 36 unit; kalau ini NaN berarti
      // koordinat topologinya tidak terbaca dan tidak ada yang tergambar.
      scale,
    })
    for (const sl of slots) rackSlotByName.set(sl.name, sl)
    if (pendingRobots) setRobots(pendingRobots)
    if (pendingBins) setBinStatus(pendingBins)
  }

  // Tanpa ini kegagalan hanya mendarat di console dan pengguna cuma melihat
  // kotak kosong — tidak ada bedanya dengan fitur yang rusak diam-diam.
  loadTopology().catch((err) => {
    console.error('Gagal memuat topologi peta 3D', err)
    onError?.(String(err?.message ?? err), topologyUrl || `${baseUrl}/workshop.json`)
  })

  // Robot AGV (dibuat dari bentuk dasar, mengikuti foto referensi)
  function createAGV() {
    const agv = new THREE.Group()

    const black = new THREE.MeshStandardMaterial({
      color: '#fffff', roughness: 0.5, metalness: 0.3
    })
    const dark = new THREE.MeshStandardMaterial({
      color: '#111418', roughness: 0.6
    })
    const white = new THREE.MeshStandardMaterial({
      color: '#000000', roughness: 0.4
    })
    const orange = new THREE.MeshStandardMaterial({
      color: '#f97316', roughness: 0.4
    })
    const red = new THREE.MeshBasicMaterial({ color: '#ef4444' })

    const add = (mesh, x, y, z) => {
      mesh.position.set(x, y, z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      agv.add(mesh)
      return mesh
    }

    // Badan bawah (hitam, sudut membulat)
    add(
      new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.42, 1.0, 4, 0.1), black),
      0, 0.2, 0
    )

    // Panel putih depan + lampu merah
    add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.6), white), 0.81, 0.3, 0)
    add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), red), 0.84, 0.3, -0.12)
    add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), red), 0.84, 0.3, 0.12)

    // Strip oranye di kedua sisi
    for (const side of [-1, 1]) {
      add(
        new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.07, 0.02), orange),
        0, 0.3, side * 0.505
      )
    }

    // Roda di kedua sisi
    for (const side of [-0.9, 0.9]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.14, 24),
        dark
      )
      wheel.rotation.x = Math.PI / 2
      add(wheel, -0.08, 0.17, side * 0.5)
    }

    // Pelat atas (lift platform) lebih lebar, hitam
    add(
      new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.08, 1.1, 4, 0.04), dark),
      0, 0.52, 0
    )

    // Cincin lingkaran di tengah pelat atas
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.03, 12, 32),
      black
    )
    ring.rotation.x = Math.PI / 2
    add(ring, 0, 0.57, 0)

    return agv
  }

  // Tidak ada AGV simulasi di sini. Robot yang tampil semuanya berasal
  // dari telemetri RCS lewat setRobots() di bawah, sama seperti peta 2D
  // di Dashboard — satu sumber kebenaran, bukan dua.

  // 9. Kontrol kamera
  //
  // Blok ini sempat ikut terhapus saat simulasi AGV dibuang, padahal
  // letaknya bersebelahan — akibatnya controls.update() di animate()
  // melempar ReferenceError tiap frame dan peta tidak pernah tergambar
  // sama sekali. Pemetaan tombolnya mengikuti petunjuk di kartu:
  // klik kiri memutar, scroll zoom, klik kanan / Shift+klik kiri menggeser
  // (itu perilaku bawaan OrbitControls).
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.minAzimuthAngle = -Infinity
  controls.maxAzimuthAngle = Infinity
  controls.screenSpacePanning = true
  controls.panSpeed = 1.2
  controls.keyPanSpeed = 20
  controls.listenToKeyEvents(window) // tombol panah = geser map

  // 10. Reset kamera & preset sudut pandang
  function setView(x, y, z) {
    camera.position.set(x, y, z)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  const views = {
    reset: [24, 24, 30],
    top: [0, 60, 0.01],
    bottom: [0, -60, 0.01],
    front: [0, 8, 50],
    back: [0, 8, -50],
    left: [-50, 8, 0],
    right: [50, 8, 0]
  }

  // 11. Responsif ketika ukuran browser berubah
  function resizeRenderer() {
    const width = container.clientWidth
    const height = container.clientHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height, false)
  }

  const resizeObserver = new ResizeObserver(
    resizeRenderer
  )

  resizeObserver.observe(container)

  // 12. Render scene

  let frameId = 0
  // ---- API realtime ------------------------------------------------------

  /** Label nama robot yang selalu menghadap kamera. */
  function makeLabel(text) {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'rgba(15,31,82,0.85)'
    ctx.roundRect?.(0, 0, 256, 64, 16)
    ctx.fill()
    ctx.font = 'bold 34px sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text.slice(0, 14), 128, 34)
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false })
    )
    sprite.scale.set(1.6, 0.4, 1)
    sprite.position.y = 1.6
    return sprite
  }

  /**
   * Robot nyata dari telemetri RCS. Dipanggil ulang tiap sinyal 'robots'.
   *
   * Posisi tidak dipasang langsung melainkan dijadikan target, lalu
   * didekati tiap frame di animate() — tanpa itu marker akan meloncat tiap
   * kali data baru tiba, bukan meluncur seperti di peta 2D.
   */
  function setRobots(list) {
    pendingRobots = list
    if (!toWorldLive) return

    // Satu pengukuran per batch, bukan per robot: semua robot dalam satu
    // push tiba bersamaan, jadi jaraknya sama.
    const segmentMs = tweenDuration(performance.now())

    const seen = new Set()
    for (const robot of list) {
      if (robot.x == null || robot.y == null) continue
      seen.add(robot.id)

      let entry = liveRobots.get(robot.id)
      if (!entry) {
        const group = createAGV()
        group.scale.setScalar(0.2)
        group.add(makeLabel(robot.name ?? ''))
        liveGroup.add(group)
        entry = {
          group,
          from: new THREE.Vector3(),
          target: new THREE.Vector3(),
          fromYaw: 0,
          targetYaw: 0,
          startedAt: 0,
          duration: UPDATE_FALLBACK_MS,
          placed: false,
        }
        liveRobots.set(robot.id, entry)
      }

      const target = toWorldLive(robot.x, robot.y, 0)
      // Orientasi RCS dalam derajat, berlawanan arah jarum jam dari +x;
      // sumbu z dunia 3D terbalik, jadi tandanya ikut dibalik.
      const targetYaw = -((robot.orientation ?? 0) * Math.PI) / 180

      if (!entry.placed) {
        entry.group.position.copy(target)
        entry.group.rotation.y = targetYaw
        entry.placed = true
      }

      // Tween baru selalu dimulai dari posisi yang SEDANG tergambar, bukan
      // dari target lama — kalau tidak, membelokkan tween di tengah jalan
      // akan membuat robot melompat mundur ke titik awal tween sebelumnya.
      entry.from.copy(entry.group.position)
      entry.fromYaw = entry.group.rotation.y
      entry.target.copy(target)
      entry.targetYaw = targetYaw
      entry.startedAt = performance.now()
      entry.duration = segmentMs

      // Rak yang sedang diangkat. RCS melaporkannya lewat payLoad pada
      // telemetri perangkat; nilai kosong / "0" / "none" berarti kosong.
      // Dulu ini cuma simulasi yang dipicu tombol — sekarang mengikuti
      // muatan robot yang sebenarnya.
      const carrying = hasPayload(robot.payload)
      if (carrying && !entry.rack && rackPrototype) {
        const rack = rackPrototype.clone(true)
        markShared(rack)
        // Tinggi angkat relatif terhadap badan AMR; group robot diskalakan
        // 0.2 sehingga nilai ini dalam satuan lokal robot.
        rack.position.y = 3.0
        entry.group.add(rack)
        entry.rack = rack
      } else if (!carrying && entry.rack) {
        entry.group.remove(entry.rack)
        entry.rack = null
      }

      // Robot beralarm diberi tanda merah di atas kepalanya.
      if (robot.hasActiveAlarm && !entry.alarm) {
        const alarm = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 16, 16),
          new THREE.MeshBasicMaterial({ color: '#EF4444' })
        )
        alarm.position.y = 4.2
        entry.group.add(alarm)
        entry.alarm = alarm
      } else if (!robot.hasActiveAlarm && entry.alarm) {
        entry.group.remove(entry.alarm)
        entry.alarm.geometry.dispose()
        entry.alarm.material.dispose()
        entry.alarm = null
      }
    }

    // Robot yang hilang dari telemetri dibuang, bukan ditinggal membeku.
    for (const [id, entry] of liveRobots) {
      if (seen.has(id)) continue
      liveGroup.remove(entry.group)
      liveRobots.delete(id)
    }
  }

  /**
   * Status bin per kode lokasi: '2' penuh, '0' kosong.
   *
   * Ditandai dengan cakram warna di atas rak, bukan dengan mewarnai model
   * raknya — material GLB dipakai bersama semua salinan rak, jadi mengubah
   * satu akan mengubah semuanya.
   */
  function setBinStatus(byCode) {
    pendingBins = byCode
    if (!toWorldLive) return

    for (const [code, status] of byCode) {
      const slot = rackSlotByName.get(code)
      if (!slot) continue

      let marker = binMarkers.get(code)
      if (!marker) {
        marker = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 0.06, 20),
          new THREE.MeshBasicMaterial({ color: '#22C55E' })
        )
        marker.position.copy(slot.world)
        marker.position.y = 2.4
        liveGroup.add(marker)
        binMarkers.set(code, marker)
      }
      // Hijau penuh, abu-abu kosong — sama dengan arti nodeStatus di RCS.
      marker.material.color.set(String(status) === '2' ? '#22C55E' : '#94A3B8')
    }
  }

  let disposed = false

  function animate() {
    if (disposed) return
    frameId = requestAnimationFrame(animate)


    // Meluncur ke pembacaan terakhir sepanjang durasi segmennya. Pelembutan
    // smoothstep menghilangkan sentakan di awal dan akhir tiap segmen,
    // sehingga sambungan antar pembacaan tidak terasa.
    const nowMs = performance.now()
    for (const entry of liveRobots.values()) {
      const raw = (nowMs - entry.startedAt) / entry.duration
      const t = raw >= 1 ? 1 : raw <= 0 ? 0 : raw * raw * (3 - 2 * raw)
      entry.group.position.lerpVectors(entry.from, entry.target, t)

      let diff = entry.targetYaw - entry.fromYaw
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      entry.group.rotation.y = entry.fromYaw + diff * t
    }

    const now = performance.now() / 1000
    for (const update of armUpdates) update(now)
    controls.update()
    renderer.render(scene, camera)
  }

  animate()

  function dispose() {
    disposed = true
    cancelAnimationFrame(frameId)
    resizeObserver.disconnect()
    controls.stopListenToKeyEvents()
    controls.dispose()
    renderer.dispose()
    renderer.domElement.remove()
    scene.traverse((o) => {
      // Geometry milik model yang di-cache dipakai bersama instance lain.
      if (o.userData?.sharedWithCache) return
      if (o.geometry) o.geometry.dispose()
    })
  }

  return {
    setView: (name) => setView(...views[name]),
    setRobots,
    setBinStatus,
    dispose
  }

}
