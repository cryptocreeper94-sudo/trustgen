/* ====== TrustGen — Character Creator ======
 * Procedural character construction from primitives.
 * Customizable: body type, skin tone, hair, clothing, accessories.
 * No external models needed — everything generated in-engine.
 */
import * as THREE from 'three'

// ── Types ──

export type BodyType = 'average' | 'athletic' | 'stocky' | 'slim' | 'child' | 'stylized'
export type HairStyle = 'none' | 'short' | 'medium' | 'long' | 'mohawk' | 'bun' | 'ponytail' | 'afro'
export type ClothingTop = 'none' | 'tshirt' | 'dress-shirt' | 'jacket' | 'hoodie' | 'tank-top' | 'suit'
export type ClothingBottom = 'none' | 'jeans' | 'slacks' | 'shorts' | 'skirt' | 'sweats'
export type Footwear = 'none' | 'shoes' | 'boots' | 'sandals' | 'sneakers'
export type Accessory = 'none' | 'glasses' | 'hat' | 'headphones' | 'watch' | 'backpack' | 'tie'

export interface CharacterConfig {
    name: string
    bodyType: BodyType
    /** Skin tone hex color */
    skinTone: string
    hairStyle: HairStyle
    hairColor: string
    clothingTop: ClothingTop
    clothingTopColor: string
    clothingBottom: ClothingBottom
    clothingBottomColor: string
    footwear: Footwear
    footwearColor: string
    accessories: Accessory[]
    /** Height multiplier (0.8–1.4) */
    height: number
}

// ── Skin Tone Presets ──

export const SKIN_TONE_PRESETS: { name: string; hex: string }[] = [
    { name: 'Porcelain', hex: '#FFE0BD' },
    { name: 'Light', hex: '#FDBCB4' },
    { name: 'Warm Beige', hex: '#E8B88A' },
    { name: 'Tan', hex: '#C68642' },
    { name: 'Brown', hex: '#8D5524' },
    { name: 'Dark Brown', hex: '#6B3A2A' },
    { name: 'Deep', hex: '#4A2912' },
    { name: 'Olive', hex: '#C4A882' },
    { name: 'Robot Silver', hex: '#B0B0B0' },
    { name: 'Stylized Blue', hex: '#5B9BD5' },
]

// ── Default Config ──

export const DEFAULT_CHARACTER: CharacterConfig = {
    name: 'Character',
    bodyType: 'average',
    skinTone: '#FDBCB4',
    hairStyle: 'short',
    hairColor: '#2C1810',
    clothingTop: 'tshirt',
    clothingTopColor: '#2563EB',
    clothingBottom: 'jeans',
    clothingBottomColor: '#1E3A5F',
    footwear: 'sneakers',
    footwearColor: '#333333',
    accessories: [],
    height: 1.0,
}

// ── Body Proportions by Type ──

const BODY_PROPS: Record<BodyType, {
    torsoW: number; torsoH: number; torsoD: number;
    headR: number; armR: number; armH: number;
    legR: number; legH: number; shoulderW: number;
}> = {
    average: { torsoW: 0.40, torsoH: 0.50, torsoD: 0.25, headR: 0.12, armR: 0.045, armH: 0.55, legR: 0.06, legH: 0.60, shoulderW: 0.25 },
    athletic: { torsoW: 0.44, torsoH: 0.52, torsoD: 0.24, headR: 0.12, armR: 0.055, armH: 0.55, legR: 0.065, legH: 0.62, shoulderW: 0.28 },
    stocky: { torsoW: 0.50, torsoH: 0.48, torsoD: 0.30, headR: 0.13, armR: 0.06, armH: 0.50, legR: 0.07, legH: 0.55, shoulderW: 0.30 },
    slim: { torsoW: 0.34, torsoH: 0.52, torsoD: 0.20, headR: 0.11, armR: 0.04, armH: 0.56, legR: 0.05, legH: 0.62, shoulderW: 0.22 },
    child: { torsoW: 0.30, torsoH: 0.35, torsoD: 0.20, headR: 0.13, armR: 0.04, armH: 0.35, legR: 0.05, legH: 0.35, shoulderW: 0.18 },
    stylized: { torsoW: 0.36, torsoH: 0.45, torsoD: 0.22, headR: 0.16, armR: 0.04, armH: 0.50, legR: 0.05, legH: 0.55, shoulderW: 0.22 },
}

// ── Helper ──

function mat(color: string, met = 0, rough = 0.7): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color, metalness: met, roughness: rough, side: THREE.DoubleSide })
}

// ── Build Character ──

/**
 * Generate a complete 3D character from configuration.
 */
export function buildCharacter(config: CharacterConfig = DEFAULT_CHARACTER): THREE.Group {
    const group = new THREE.Group()
    group.name = config.name || 'Character'
    const scale = config.height
    const bp = BODY_PROPS[config.bodyType]

    // ── Skin material ──
    const skinMat = mat(config.skinTone, 0, 0.8)

    // ── Head ──
    const head = new THREE.Mesh(new THREE.SphereGeometry(bp.headR, 24, 24), skinMat)
    head.name = 'Head'
    head.position.set(0, bp.legH + bp.torsoH + bp.headR * 1.2, 0)
    head.castShadow = true
    group.add(head)

    // Eyes
    const eyeMat = mat('#ffffff', 0, 0.1)
    const pupilMat = mat('#1a1a1a', 0, 0.1)
    for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 16), eyeMat)
        eye.position.set(side * 0.04, bp.legH + bp.torsoH + bp.headR * 1.25, bp.headR * 0.85)
        group.add(eye)
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.01, 12, 12), pupilMat)
        pupil.position.set(side * 0.04, bp.legH + bp.torsoH + bp.headR * 1.25, bp.headR * 0.9)
        group.add(pupil)
    }

    // ── Hair ──
    if (config.hairStyle !== 'none') {
        const hairMat = mat(config.hairColor, 0, 0.9)
        const headY = bp.legH + bp.torsoH + bp.headR * 1.2

        switch (config.hairStyle) {
            case 'short': {
                const hair = new THREE.Mesh(new THREE.SphereGeometry(bp.headR * 1.05, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat)
                hair.position.set(0, headY + bp.headR * 0.05, 0)
                hair.name = 'Hair'
                group.add(hair)
                break
            }
            case 'medium': {
                const hair = new THREE.Mesh(new THREE.SphereGeometry(bp.headR * 1.1, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat)
                hair.position.set(0, headY + bp.headR * 0.03, 0)
                group.add(hair)
                const back = new THREE.Mesh(new THREE.BoxGeometry(bp.headR * 1.5, bp.headR * 1.2, bp.headR * 0.4), hairMat)
                back.position.set(0, headY - bp.headR * 0.3, -bp.headR * 0.6)
                group.add(back)
                break
            }
            case 'long': {
                const hair = new THREE.Mesh(new THREE.SphereGeometry(bp.headR * 1.12, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat)
                hair.position.set(0, headY + bp.headR * 0.03, 0)
                group.add(hair)
                const back = new THREE.Mesh(new THREE.BoxGeometry(bp.headR * 1.8, bp.headR * 2.5, bp.headR * 0.35), hairMat)
                back.position.set(0, headY - bp.headR * 1.0, -bp.headR * 0.65)
                group.add(back)
                break
            }
            case 'afro': {
                const afro = new THREE.Mesh(new THREE.SphereGeometry(bp.headR * 1.6, 24, 24), hairMat)
                afro.position.set(0, headY + bp.headR * 0.2, 0)
                group.add(afro)
                break
            }
            case 'mohawk': {
                for (let i = 0; i < 5; i++) {
                    const spike = new THREE.Mesh(new THREE.ConeGeometry(bp.headR * 0.25, bp.headR * 0.6, 8), hairMat)
                    spike.position.set(0, headY + bp.headR * 0.5, -bp.headR * 0.3 + i * bp.headR * 0.2)
                    group.add(spike)
                }
                break
            }
            case 'bun': {
                const cap = new THREE.Mesh(new THREE.SphereGeometry(bp.headR * 1.05, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat)
                cap.position.set(0, headY + bp.headR * 0.05, 0)
                group.add(cap)
                const bun = new THREE.Mesh(new THREE.SphereGeometry(bp.headR * 0.4, 16, 16), hairMat)
                bun.position.set(0, headY + bp.headR * 0.7, -bp.headR * 0.3)
                group.add(bun)
                break
            }
            case 'ponytail': {
                const cap = new THREE.Mesh(new THREE.SphereGeometry(bp.headR * 1.05, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat)
                cap.position.set(0, headY + bp.headR * 0.05, 0)
                group.add(cap)
                const tail = new THREE.Mesh(new THREE.CylinderGeometry(bp.headR * 0.15, bp.headR * 0.08, bp.headR * 1.5, 12), hairMat)
                tail.position.set(0, headY - bp.headR * 0.5, -bp.headR * 0.7)
                tail.rotation.x = 0.3
                group.add(tail)
                break
            }
        }
    }

    // ── Torso ──
    const torsoColor = config.clothingTop !== 'none' ? config.clothingTopColor : config.skinTone
    const torsoMat = config.clothingTop !== 'none' ? mat(torsoColor, 0, 0.6) : skinMat
    const torso = new THREE.Mesh(new THREE.BoxGeometry(bp.torsoW, bp.torsoH, bp.torsoD), torsoMat)
    torso.name = 'Torso'
    torso.position.set(0, bp.legH + bp.torsoH / 2, 0)
    torso.castShadow = true
    group.add(torso)

    // Collar / details based on clothing type
    if (config.clothingTop === 'suit' || config.clothingTop === 'jacket') {
        const lapel = new THREE.Mesh(new THREE.BoxGeometry(bp.torsoW * 0.3, bp.torsoH * 0.4, bp.torsoD * 0.05), mat('#1a1a1a', 0.3, 0.5))
        lapel.position.set(0, bp.legH + bp.torsoH * 0.7, bp.torsoD / 2 + 0.01)
        group.add(lapel)
    }

    // ── Arms ──
    const armMat = config.clothingTop !== 'none' && config.clothingTop !== 'tank-top' ? torsoMat : skinMat
    for (const side of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(bp.armR, bp.armH - bp.armR * 2, 12, 12), armMat)
        arm.name = side === -1 ? 'L Arm' : 'R Arm'
        arm.position.set(side * bp.shoulderW, bp.legH + bp.torsoH * 0.75 - bp.armH / 2, 0)
        arm.castShadow = true
        group.add(arm)

        // Hands
        const hand = new THREE.Mesh(new THREE.SphereGeometry(bp.armR * 1.3, 12, 12), skinMat)
        hand.position.set(side * bp.shoulderW, bp.legH + bp.torsoH * 0.75 - bp.armH, 0)
        group.add(hand)
    }

    // ── Legs ──
    const legColor = config.clothingBottom !== 'none' ? config.clothingBottomColor : config.skinTone
    const legMat = config.clothingBottom !== 'none' ? mat(legColor, 0, 0.7) : skinMat
    for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(bp.legR, bp.legH - bp.legR * 2, 12, 12), legMat)
        leg.name = side === -1 ? 'L Leg' : 'R Leg'
        leg.position.set(side * bp.torsoW * 0.25, bp.legH / 2, 0)
        leg.castShadow = true
        group.add(leg)
    }

    // ── Footwear ──
    if (config.footwear !== 'none') {
        const shoeMat = mat(config.footwearColor, 0.2, 0.6)
        for (const side of [-1, 1]) {
            const shoe = new THREE.Mesh(new THREE.BoxGeometry(bp.legR * 2, 0.06, bp.legR * 3), shoeMat)
            shoe.position.set(side * bp.torsoW * 0.25, 0.03, bp.legR * 0.5)
            shoe.castShadow = true
            group.add(shoe)
        }
    }

    // ── Accessories ──
    for (const acc of config.accessories) {
        const headY = bp.legH + bp.torsoH + bp.headR * 1.2
        switch (acc) {
            case 'glasses': {
                const glassMat = mat('#333333', 0.7, 0.2)
                const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.01), glassMat)
                bridge.position.set(0, headY, bp.headR * 0.92)
                group.add(bridge)
                for (const s of [-1, 1]) {
                    const lens = new THREE.Mesh(new THREE.RingGeometry(0.015, 0.025, 16), glassMat)
                    lens.position.set(s * 0.035, headY, bp.headR * 0.93)
                    group.add(lens)
                }
                break
            }
            case 'hat': {
                const hatMat = mat('#2F4F4F', 0, 0.7)
                const crown = new THREE.Mesh(new THREE.CylinderGeometry(bp.headR * 0.9, bp.headR * 0.8, bp.headR * 0.6, 20), hatMat)
                crown.position.set(0, headY + bp.headR * 0.7, 0)
                group.add(crown)
                const brim = new THREE.Mesh(new THREE.CylinderGeometry(bp.headR * 1.3, bp.headR * 1.3, 0.015, 24), hatMat)
                brim.position.set(0, headY + bp.headR * 0.42, 0)
                group.add(brim)
                break
            }
            case 'headphones': {
                const hpMat = mat('#1a1a1a', 0.5, 0.3)
                const band = new THREE.Mesh(new THREE.TorusGeometry(bp.headR * 1.05, 0.012, 8, 16, Math.PI), hpMat)
                band.position.set(0, headY + bp.headR * 0.6, 0)
                group.add(band)
                for (const s of [-1, 1]) {
                    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16), hpMat)
                    cup.position.set(s * bp.headR * 1.05, headY, 0)
                    cup.rotation.z = Math.PI / 2
                    group.add(cup)
                }
                break
            }
            case 'tie': {
                const tieMat = mat('#8B0000', 0.1, 0.5)
                const tie = new THREE.Mesh(new THREE.BoxGeometry(0.04, bp.torsoH * 0.6, 0.01), tieMat)
                tie.position.set(0, bp.legH + bp.torsoH * 0.5, bp.torsoD / 2 + 0.01)
                group.add(tie)
                break
            }
        }
    }

    // Apply height scale
    group.scale.setScalar(scale)

    return group
}

// ── Quick Character Presets ──

export const CHARACTER_PRESETS: Record<string, CharacterConfig> = {
    narrator: {
        ...DEFAULT_CHARACTER, name: 'Narrator',
        clothingTop: 'suit', clothingTopColor: '#1a1a2e', clothingBottom: 'slacks',
        clothingBottomColor: '#1a1a2e', footwear: 'shoes', footwearColor: '#1a1a1a',
        accessories: ['tie'], hairStyle: 'short', hairColor: '#2C1810',
    },
    presenter: {
        ...DEFAULT_CHARACTER, name: 'Presenter',
        clothingTop: 'dress-shirt', clothingTopColor: '#4169E1',
        clothingBottom: 'slacks', clothingBottomColor: '#2F2F2F',
        accessories: ['glasses'], hairStyle: 'medium', hairColor: '#4a3728',
    },
    scientist: {
        ...DEFAULT_CHARACTER, name: 'Scientist',
        clothingTop: 'jacket', clothingTopColor: '#FFFFFF',
        clothingBottom: 'slacks', clothingBottomColor: '#333333',
        accessories: ['glasses'], hairStyle: 'bun', hairColor: '#8B4513',
    },
    casual: {
        ...DEFAULT_CHARACTER, name: 'Casual',
        clothingTop: 'hoodie', clothingTopColor: '#2E8B57',
        clothingBottom: 'jeans', clothingBottomColor: '#2F4F6F',
        footwear: 'sneakers', footwearColor: '#FFFFFF',
        accessories: ['headphones'], hairStyle: 'short', hairColor: '#1a1a1a',
    },
    executive: {
        ...DEFAULT_CHARACTER, name: 'Executive',
        bodyType: 'athletic', clothingTop: 'suit', clothingTopColor: '#0a0a15',
        clothingBottom: 'slacks', clothingBottomColor: '#0a0a15',
        footwear: 'shoes', footwearColor: '#1a1a1a',
        accessories: ['watch', 'tie'], hairStyle: 'short', hairColor: '#2C1810',
        skinTone: '#C68642',
    },
    child: {
        ...DEFAULT_CHARACTER, name: 'Kid',
        bodyType: 'child', height: 0.65,
        clothingTop: 'tshirt', clothingTopColor: '#FF6347',
        clothingBottom: 'shorts', clothingBottomColor: '#4682B4',
        footwear: 'sneakers', footwearColor: '#FF69B4',
        hairStyle: 'short', hairColor: '#FFD700',
    },
}
