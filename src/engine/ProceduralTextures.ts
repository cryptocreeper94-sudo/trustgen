/* ====== TrustGen — Procedural Texture Engine ======
 * Generates Canvas 2D-based textures at runtime.
 * No API calls, no GPU, works offline.
 *
 * Each generator produces a color map (diffuse) and optional
 * normal/roughness maps for PBR rendering.
 *
 * Usage:
 *   const tex = generateProceduralTexture('wood', 512)
 *   material.map = tex.diffuse
 *   material.normalMap = tex.normal
 *   material.roughnessMap = tex.roughness
 */

import * as THREE from 'three'

export interface ProceduralTextureSet {
    diffuse: THREE.CanvasTexture
    normal?: THREE.CanvasTexture
    roughness?: THREE.CanvasTexture
}

export type TexturePresetName =
    | 'wood' | 'oak' | 'pine' | 'darkwood'
    | 'marble' | 'granite' | 'stone' | 'brick'
    | 'metal' | 'brushed_metal' | 'rust'
    | 'fabric' | 'leather'
    | 'concrete' | 'plaster'
    | 'grass' | 'dirt' | 'sand'
    | 'lava' | 'ice' | 'crystal'

// ── Noise helpers ──

function seededRandom(seed: number): () => number {
    let s = seed
    return () => {
        s = (s * 16807 + 0) % 2147483647
        return (s - 1) / 2147483646
    }
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

function smoothstep(t: number): number {
    return t * t * (3 - 2 * t)
}

// Simple value noise
function valueNoise(x: number, y: number, _rand?: () => number): number {
    const ix = Math.floor(x), iy = Math.floor(y)
    const fx = x - ix, fy = y - iy
    const sx = smoothstep(fx), sy = smoothstep(fy)

    // Use position-seeded values
    const hash = (a: number, b: number) => {
        const h = ((a * 374761393 + b * 668265263 + 1274126177) & 0x7fffffff) / 2147483647
        return h
    }

    const n00 = hash(ix, iy)
    const n10 = hash(ix + 1, iy)
    const n01 = hash(ix, iy + 1)
    const n11 = hash(ix + 1, iy + 1)

    return lerp(lerp(n00, n10, sx), lerp(n01, n11, sx), sy)
}

function fbm(x: number, y: number, octaves: number, rand: () => number): number {
    let val = 0, amp = 0.5, freq = 1
    for (let i = 0; i < octaves; i++) {
        val += amp * valueNoise(x * freq, y * freq, rand)
        amp *= 0.5
        freq *= 2
    }
    return val
}

// ── Canvas helpers ──

function createCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    return [canvas, ctx]
}

function canvasToTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.needsUpdate = true
    return tex
}

function hexToRgb(hex: string): [number, number, number] {
    const v = parseInt(hex.replace('#', ''), 16)
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

// ══════════════════════════════════════════
//  TEXTURE GENERATORS
// ══════════════════════════════════════════

function generateWood(size: number, baseColor: string = '#8B4513', grainColor: string = '#654321'): ProceduralTextureSet {
    const [canvas, ctx] = createCanvas(size)
    const [br, bg, bb] = hexToRgb(baseColor)
    const [gr, gg, gb] = hexToRgb(grainColor)
    const rand = seededRandom(42)
    const imgData = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size, ny = y / size
            // Wood ring pattern
            const ring = Math.sin((nx * 12 + fbm(nx * 8, ny * 2, 4, rand) * 2) * Math.PI * 2) * 0.5 + 0.5
            // Fine grain lines
            const grain = fbm(nx * 40, ny * 3, 3, rand) * 0.15
            const t = Math.min(1, Math.max(0, ring * 0.7 + grain))

            const i = (y * size + x) * 4
            imgData.data[i] = Math.floor(lerp(br, gr, t))
            imgData.data[i + 1] = Math.floor(lerp(bg, gg, t))
            imgData.data[i + 2] = Math.floor(lerp(bb, gb, t))
            imgData.data[i + 3] = 255
        }
    }
    ctx.putImageData(imgData, 0, 0)

    // Roughness map
    const [rCanvas, rCtx] = createCanvas(size)
    const rData = rCtx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const v = Math.floor(180 + fbm(x / size * 20, y / size * 4, 3, rand) * 60)
            const i = (y * size + x) * 4
            rData.data[i] = rData.data[i + 1] = rData.data[i + 2] = v
            rData.data[i + 3] = 255
        }
    }
    rCtx.putImageData(rData, 0, 0)

    return { diffuse: canvasToTexture(canvas), roughness: canvasToTexture(rCanvas) }
}

function generateMarble(size: number, baseColor: string = '#F5F5F5', veinColor: string = '#808080'): ProceduralTextureSet {
    const [canvas, ctx] = createCanvas(size)
    const [br, bg, bb] = hexToRgb(baseColor)
    const [vr, vg, vb] = hexToRgb(veinColor)
    const rand = seededRandom(77)
    const imgData = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size, ny = y / size
            const turb = fbm(nx * 6, ny * 6, 5, rand)
            const vein = Math.sin((nx + turb * 3) * Math.PI * 4) * 0.5 + 0.5
            const t = smoothstep(vein) * 0.4

            const i = (y * size + x) * 4
            imgData.data[i] = Math.floor(lerp(br, vr, t))
            imgData.data[i + 1] = Math.floor(lerp(bg, vg, t))
            imgData.data[i + 2] = Math.floor(lerp(bb, vb, t))
            imgData.data[i + 3] = 255
        }
    }
    ctx.putImageData(imgData, 0, 0)
    return { diffuse: canvasToTexture(canvas) }
}

function generateMetal(size: number, baseColor: string = '#A8A8A8', scratches: boolean = true): ProceduralTextureSet {
    const [canvas, ctx] = createCanvas(size)
    const [br, bg, bb] = hexToRgb(baseColor)
    const rand = seededRandom(99)
    const imgData = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size, ny = y / size
            // Subtle noise variation
            const noise = fbm(nx * 20, ny * 20, 3, rand) * 0.15
            // Brushed lines (horizontal)
            const brush = scratches ? Math.sin(ny * size * 0.8) * 0.02 + fbm(nx * 50, ny * 2, 2, rand) * 0.05 : 0
            const v = Math.min(1, Math.max(0, 0.85 + noise + brush))

            const i = (y * size + x) * 4
            imgData.data[i] = Math.floor(br * v)
            imgData.data[i + 1] = Math.floor(bg * v)
            imgData.data[i + 2] = Math.floor(bb * v)
            imgData.data[i + 3] = 255
        }
    }
    ctx.putImageData(imgData, 0, 0)

    // Roughness (scratches are rougher)
    const [rCanvas, rCtx] = createCanvas(size)
    const rData = rCtx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const v = Math.floor(30 + fbm(x / size * 30, y / size * 30, 3, rand) * 50)
            const i = (y * size + x) * 4
            rData.data[i] = rData.data[i + 1] = rData.data[i + 2] = v
            rData.data[i + 3] = 255
        }
    }
    rCtx.putImageData(rData, 0, 0)

    return { diffuse: canvasToTexture(canvas), roughness: canvasToTexture(rCanvas) }
}

function generateStone(size: number, baseColor: string = '#808080'): ProceduralTextureSet {
    const [canvas, ctx] = createCanvas(size)
    const [br, bg, bb] = hexToRgb(baseColor)
    const rand = seededRandom(55)
    const imgData = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size, ny = y / size
            const noise = fbm(nx * 10, ny * 10, 5, rand)
            const spots = fbm(nx * 30, ny * 30, 2, rand) * 0.1
            const v = 0.6 + noise * 0.35 + spots

            const i = (y * size + x) * 4
            imgData.data[i] = Math.floor(Math.min(255, br * v))
            imgData.data[i + 1] = Math.floor(Math.min(255, bg * v))
            imgData.data[i + 2] = Math.floor(Math.min(255, bb * v))
            imgData.data[i + 3] = 255
        }
    }
    ctx.putImageData(imgData, 0, 0)
    return { diffuse: canvasToTexture(canvas) }
}

function generateBrick(size: number): ProceduralTextureSet {
    const [canvas, ctx] = createCanvas(size)
    const rand = seededRandom(33)

    // Mortar base
    ctx.fillStyle = '#B0A090'
    ctx.fillRect(0, 0, size, size)

    const brickW = size / 6, brickH = size / 12
    const mortarW = size * 0.006

    for (let row = 0; row < 14; row++) {
        const offset = (row % 2) * (brickW / 2)
        for (let col = -1; col < 8; col++) {
            const bx = col * brickW + offset + mortarW
            const by = row * brickH + mortarW
            // Random brick color variation
            const r = 140 + Math.floor(rand() * 40)
            const g = 55 + Math.floor(rand() * 30)
            const b = 30 + Math.floor(rand() * 20)
            ctx.fillStyle = `rgb(${r},${g},${b})`
            ctx.fillRect(bx, by, brickW - mortarW * 2, brickH - mortarW * 2)

            // Subtle noise on brick surface
            for (let i = 0; i < 8; i++) {
                const nx = bx + rand() * (brickW - mortarW * 2)
                const ny = by + rand() * (brickH - mortarW * 2)
                const nr = r + Math.floor((rand() - 0.5) * 20)
                ctx.fillStyle = `rgba(${nr},${g},${b},0.3)`
                ctx.fillRect(nx, ny, 2, 2)
            }
        }
    }

    return { diffuse: canvasToTexture(canvas) }
}

function generateFabric(size: number, baseColor: string = '#4682B4'): ProceduralTextureSet {
    const [canvas, ctx] = createCanvas(size)
    const [br, bg, bb] = hexToRgb(baseColor)
    const rand = seededRandom(88)
    const imgData = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Woven pattern
            const warpX = Math.sin(x * 0.8) * 0.5 + 0.5
            const warpY = Math.sin(y * 0.8) * 0.5 + 0.5
            const weave = ((x + y) % 4 < 2) ? warpX : warpY
            const noise = fbm(x / size * 30, y / size * 30, 2, rand) * 0.1
            const v = 0.75 + weave * 0.15 + noise

            const i = (y * size + x) * 4
            imgData.data[i] = Math.floor(Math.min(255, br * v))
            imgData.data[i + 1] = Math.floor(Math.min(255, bg * v))
            imgData.data[i + 2] = Math.floor(Math.min(255, bb * v))
            imgData.data[i + 3] = 255
        }
    }
    ctx.putImageData(imgData, 0, 0)
    return { diffuse: canvasToTexture(canvas) }
}

function generateLava(size: number): ProceduralTextureSet {
    const [canvas, ctx] = createCanvas(size)
    const rand = seededRandom(66)
    const imgData = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size, ny = y / size
            const turb = fbm(nx * 5, ny * 5, 5, rand)
            const cracks = Math.abs(Math.sin((nx * 8 + turb * 4) * Math.PI)) * 0.8
            const hot = smoothstep(1 - cracks)

            const i = (y * size + x) * 4
            imgData.data[i] = Math.floor(lerp(30, 255, hot))
            imgData.data[i + 1] = Math.floor(lerp(10, 120, hot * hot))
            imgData.data[i + 2] = Math.floor(lerp(5, 20, hot))
            imgData.data[i + 3] = 255
        }
    }
    ctx.putImageData(imgData, 0, 0)
    return { diffuse: canvasToTexture(canvas) }
}

function generateGrass(size: number): ProceduralTextureSet {
    const [canvas, ctx] = createCanvas(size)
    const rand = seededRandom(44)
    const imgData = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size, ny = y / size
            const base = fbm(nx * 8, ny * 8, 4, rand)
            const detail = fbm(nx * 40, ny * 40, 2, rand) * 0.15

            const i = (y * size + x) * 4
            imgData.data[i] = Math.floor(30 + base * 40 + detail * 20)
            imgData.data[i + 1] = Math.floor(80 + base * 80 + detail * 40)
            imgData.data[i + 2] = Math.floor(15 + base * 20 + detail * 10)
            imgData.data[i + 3] = 255
        }
    }
    ctx.putImageData(imgData, 0, 0)
    return { diffuse: canvasToTexture(canvas) }
}

function generateSand(size: number): ProceduralTextureSet {
    const [canvas, ctx] = createCanvas(size)
    const rand = seededRandom(22)
    const imgData = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size, ny = y / size
            const noise = fbm(nx * 15, ny * 15, 3, rand)
            const grain = rand() * 0.08

            const i = (y * size + x) * 4
            imgData.data[i] = Math.floor(195 + noise * 40 + grain * 20)
            imgData.data[i + 1] = Math.floor(170 + noise * 35 + grain * 15)
            imgData.data[i + 2] = Math.floor(120 + noise * 30 + grain * 10)
            imgData.data[i + 3] = 255
        }
    }
    ctx.putImageData(imgData, 0, 0)
    return { diffuse: canvasToTexture(canvas) }
}

function generateConcrete(size: number): ProceduralTextureSet {
    const [canvas, ctx] = createCanvas(size)
    const rand = seededRandom(11)
    const imgData = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size, ny = y / size
            const noise = fbm(nx * 12, ny * 12, 4, rand)
            const speckle = rand() * 0.04

            const v = 150 + noise * 50 + speckle * 30
            const i = (y * size + x) * 4
            imgData.data[i] = Math.floor(v * 0.95)
            imgData.data[i + 1] = Math.floor(v * 0.95)
            imgData.data[i + 2] = Math.floor(v)
            imgData.data[i + 3] = 255
        }
    }
    ctx.putImageData(imgData, 0, 0)
    return { diffuse: canvasToTexture(canvas) }
}

// ══════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════

const textureCache = new Map<string, ProceduralTextureSet>()

/**
 * Generate a procedural texture by preset name.
 * Results are cached — same name+size returns the same texture.
 */
export function generateProceduralTexture(
    preset: TexturePresetName | string,
    size: number = 256,
    baseColor?: string
): ProceduralTextureSet | null {
    const key = `${preset}-${size}-${baseColor || ''}`
    if (textureCache.has(key)) return textureCache.get(key)!

    let result: ProceduralTextureSet | null = null

    switch (preset) {
        case 'wood':
        case 'wooden':
            result = generateWood(size, baseColor || '#8B4513', '#654321'); break
        case 'oak':
            result = generateWood(size, '#B8860B', '#8B6914'); break
        case 'pine':
            result = generateWood(size, '#DEB887', '#C4A06A'); break
        case 'darkwood':
            result = generateWood(size, '#3E2723', '#2C1B13'); break
        case 'marble':
            result = generateMarble(size, baseColor || '#F5F5F5', '#808080'); break
        case 'granite':
            result = generateMarble(size, '#696969', '#404040'); break
        case 'stone':
            result = generateStone(size, baseColor || '#808080'); break
        case 'brick':
            result = generateBrick(size); break
        case 'metal':
        case 'steel':
            result = generateMetal(size, baseColor || '#A8A8A8', true); break
        case 'brushed_metal':
            result = generateMetal(size, '#B8B8B8', true); break
        case 'rust':
            result = generateMetal(size, '#8B4513', false); break
        case 'fabric':
            result = generateFabric(size, baseColor || '#4682B4'); break
        case 'leather':
            result = generateFabric(size, baseColor || '#8B4513'); break
        case 'concrete':
            result = generateConcrete(size); break
        case 'plaster':
            result = generateConcrete(size); break
        case 'grass':
            result = generateGrass(size); break
        case 'dirt':
            result = generateStone(size, '#6B4423'); break
        case 'sand':
            result = generateSand(size); break
        case 'lava':
            result = generateLava(size); break
        case 'ice':
            result = generateMarble(size, '#E0F0FF', '#B0D0E8'); break
        case 'crystal':
            result = generateMarble(size, '#E0E8FF', '#A0B0FF'); break
        default:
            return null
    }

    if (result) textureCache.set(key, result)
    return result
}

/**
 * Map a material keyword to a texture preset name (if applicable).
 * Returns null for materials that don't have textures (e.g., glass, neon).
 */
export function materialToTexturePreset(materialName: string): TexturePresetName | null {
    const map: Record<string, TexturePresetName> = {
        wood: 'wood', wooden: 'wood', oak: 'oak', pine: 'pine',
        marble: 'marble', granite: 'granite', stone: 'stone', brick: 'brick',
        metal: 'metal', steel: 'metal', iron: 'metal',
        gold: 'brushed_metal', silver: 'brushed_metal', bronze: 'brushed_metal', copper: 'brushed_metal',
        leather: 'leather', fabric: 'fabric',
        concrete: 'concrete', plaster: 'plaster',
        lava: 'lava', ice: 'ice', crystal: 'crystal',
        grass: 'grass', dirt: 'dirt', sand: 'sand',
    }
    return map[materialName.toLowerCase()] || null
}

/**
 * Dispose all cached textures (for cleanup).
 */
export function disposeTextureCache(): void {
    textureCache.forEach(set => {
        set.diffuse.dispose()
        set.normal?.dispose()
        set.roughness?.dispose()
    })
    textureCache.clear()
}
