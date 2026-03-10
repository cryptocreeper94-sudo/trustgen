/* ====== TrustGen — Procedural Generator Types ======
 * Shared types for all procedural generators (characters, creatures, nature).
 * Every generator takes a config and returns a THREE.Group.
 */

// ══════════════════════════════════════════
//  SHARED CONFIG TYPES
// ══════════════════════════════════════════

/** Numeric parameter with range constraints */
export interface ParamDef {
    label: string
    min: number
    max: number
    default: number
    step: number
}

/** Color parameter */
export interface ColorParam {
    label: string
    default: string
}

// ══════════════════════════════════════════
//  SPLINE / PROFILE TYPES
// ══════════════════════════════════════════

/** 2D point for spline profiles */
export interface Point2 { x: number; y: number }

/** 3D point */
export interface Point3 { x: number; y: number; z: number }

/** A profile curve used to lathe organic shapes */
export interface ProfileCurve {
    /** Control points defining the shape outline */
    points: Point2[]
    /** Whether to close the curve */
    closed: boolean
}

/** Cross-section definition at a point along a spine */
export interface CrossSection {
    /** Position along the spine (0 = start, 1 = end) */
    t: number
    /** Radius at this cross-section */
    radius: number
    /** Optional: number of sides (higher = smoother) */
    segments?: number
    /** Optional: squash factor for non-circular sections */
    squash?: { x: number; y: number }
}

// ══════════════════════════════════════════
//  CHARACTER TYPES
// ══════════════════════════════════════════

export type BodyBuild = 'slim' | 'average' | 'athletic' | 'stocky' | 'heavy' | 'child' | 'stylized'
export type Gender = 'masculine' | 'feminine' | 'androgynous'
export type HairType = 'none' | 'buzz' | 'short' | 'medium' | 'long' | 'afro' | 'mohawk' | 'bun' | 'ponytail' | 'braids' | 'curly'
export type TopClothing = 'none' | 'tshirt' | 'button-shirt' | 'jacket' | 'hoodie' | 'tank-top' | 'suit' | 'vest' | 'coat' | 'armor'
export type BottomClothing = 'none' | 'jeans' | 'slacks' | 'shorts' | 'skirt' | 'sweats' | 'cargo' | 'armor-legs'
export type FootwearType = 'none' | 'shoes' | 'boots' | 'sandals' | 'sneakers' | 'heels' | 'armor-boots'
export type AccessoryType = 'glasses' | 'sunglasses' | 'hat' | 'cap' | 'headphones' | 'watch' | 'backpack' | 'tie' | 'bowtie' | 'scarf' | 'necklace' | 'earrings' | 'helmet' | 'crown'

export interface FaceConfig {
    /** Head width/depth ratio (0 = narrow, 1 = wide) */
    headWidth: number
    /** Jaw strength (0 = pointed, 1 = square) */
    jawWidth: number
    /** Forehead height (0 = low, 1 = high) */
    foreheadHeight: number
    /** Nose length (0 = small, 1 = long) */
    noseLength: number
    /** Nose width (0 = narrow, 1 = wide) */
    noseWidth: number
    /** Eye size (0 = small, 1 = large) */
    eyeSize: number
    /** Eye spacing (0 = close, 1 = wide) */
    eyeSpacing: number
    /** Lip fullness (0 = thin, 1 = full) */
    lipFullness: number
    /** Ear size (0 = small, 1 = large) */
    earSize: number
    /** Eye color hex */
    eyeColor: string
}

export interface CharacterGenConfig {
    name: string
    build: BodyBuild
    gender: Gender
    /** Height multiplier (0.5 = child/short, 1.0 = average, 1.3 = tall) */
    height: number
    /** Skin tone hex */
    skinTone: string
    /** Muscularity (0 = none, 1 = bodybuilder) */
    muscularity: number
    /** Body fat (0 = lean, 1 = heavy) */
    bodyFat: number
    face: FaceConfig
    hair: {
        style: HairType
        color: string
        /** Length multiplier for styles that support it */
        length: number
    }
    clothing: {
        top: TopClothing
        topColor: string
        bottom: BottomClothing
        bottomColor: string
        footwear: FootwearType
        footwearColor: string
    }
    accessories: AccessoryType[]
    /** Whether to auto-bind to humanoid rig */
    autoRig: boolean
}

// ══════════════════════════════════════════
//  CREATURE TYPES
// ══════════════════════════════════════════

export type CreatureFamily = 'quadruped' | 'bird' | 'fish' | 'insect' | 'reptile' | 'fantasy'

export interface QuadrupedConfig {
    family: 'quadruped'
    species: string
    /** Body length nose-to-tail (meters) */
    bodyLength: number
    /** Shoulder height (meters) */
    height: number
    /** Bulk/mass factor (0 = slender, 1 = massive) */
    bulk: number
    /** Leg length relative to body */
    legLength: number
    /** Head size relative to body */
    headSize: number
    /** Neck length (0 = no neck, 1 = long) */
    neckLength: number
    /** Tail length (0 = no tail, 1 = long) */
    tailLength: number
    /** Tail bushiness */
    tailBushiness: number
    /** Ear style */
    earStyle: 'pointed' | 'floppy' | 'round' | 'none'
    /** Ear size */
    earSize: number
    /** Snout length (0 = flat face, 1 = long snout) */
    snoutLength: number
    /** Primary body color */
    bodyColor: string
    /** Secondary color (belly, markings) */
    secondaryColor: string
    /** Fur roughness (0 = smooth/sleek, 1 = rough/fluffy) */
    furRoughness: number
    autoRig: boolean
}

export interface BirdConfig {
    family: 'bird'
    species: string
    bodySize: number
    wingSpan: number
    /** Wing shape (0 = rounded, 1 = pointed) */
    wingShape: number
    beakLength: number
    /** Beak curve (0 = straight, 1 = hooked) */
    beakCurve: number
    legLength: number
    /** Tail fan spread */
    tailSpread: number
    tailLength: number
    bodyColor: string
    wingColor: string
    beakColor: string
    autoRig: boolean
}

export interface FishConfig {
    family: 'fish'
    species: string
    bodyLength: number
    /** Body depth (height) */
    bodyDepth: number
    /** Body width */
    bodyWidth: number
    /** Dorsal fin height */
    dorsalHeight: number
    /** Tail fork depth */
    tailFork: number
    /** Number of side fins */
    finCount: number
    bodyColor: string
    finColor: string
    autoRig: boolean
}

export interface InsectConfig {
    family: 'insect'
    species: string
    /** Number of body segments (2-3 typical) */
    segmentCount: number
    /** Body length */
    bodyLength: number
    /** Leg pairs (3 for insects, 4 for arachnids) */
    legPairs: number
    /** Leg length */
    legLength: number
    /** Wing pairs (0, 1, or 2) */
    wingPairs: number
    /** Wing size */
    wingSize: number
    /** Antenna length (0 = none) */
    antennaLength: number
    bodyColor: string
    wingColor: string
    /** Wing transparency */
    wingOpacity: number
    autoRig: boolean
}

export type CreatureConfig = QuadrupedConfig | BirdConfig | FishConfig | InsectConfig

// ══════════════════════════════════════════
//  NATURE TYPES
// ══════════════════════════════════════════

export type TreeSpecies = 'oak' | 'pine' | 'palm' | 'birch' | 'willow' | 'cherry' | 'baobab' | 'cypress' | 'maple' | 'dead'

export interface TreeConfig {
    type: 'tree'
    species: TreeSpecies
    /** Trunk height (meters) */
    height: number
    /** Trunk base diameter */
    trunkDiameter: number
    /** Number of branching levels */
    branchLevels: number
    /** Branches per level */
    branchesPerLevel: number
    /** Branch angle from trunk (degrees) */
    branchAngle: number
    /** Canopy density (0 = sparse, 1 = dense) */
    canopyDensity: number
    /** Leaf size */
    leafSize: number
    /** Trunk color */
    trunkColor: string
    /** Leaf/canopy color */
    leafColor: string
    /** Random seed for variation */
    seed: number
}

export type FlowerSpecies = 'rose' | 'sunflower' | 'daisy' | 'tulip' | 'lily' | 'orchid' | 'lavender' | 'poppy' | 'dandelion'

export interface FlowerConfig {
    type: 'flower'
    species: FlowerSpecies
    /** Stem height */
    stemHeight: number
    /** Petal count */
    petalCount: number
    /** Petal size */
    petalSize: number
    /** Petal curl (0 = flat, 1 = fully curled) */
    petalCurl: number
    /** Petal color */
    petalColor: string
    /** Stem color */
    stemColor: string
    /** Center color */
    centerColor: string
    /** Number of leaves */
    leafCount: number
    seed: number
}

export type PlantType = 'bush' | 'fern' | 'grass' | 'vine' | 'cactus' | 'mushroom' | 'bamboo' | 'reed'

export interface PlantConfig {
    type: 'plant'
    plantType: PlantType
    /** Overall size multiplier */
    size: number
    /** Density of foliage (0-1) */
    density: number
    /** Color */
    color: string
    /** Secondary color */
    accentColor: string
    seed: number
}

export interface RockConfig {
    type: 'rock'
    /** Size category */
    sizeCategory: 'pebble' | 'stone' | 'boulder' | 'cliff'
    /** Actual size in meters */
    size: number
    /** Roughness of surface displacement */
    roughness: number
    /** How jagged vs smooth (0 = river stone, 1 = jagged cliff) */
    jaggedness: number
    /** Base color */
    color: string
    /** Whether to add moss patches */
    mossy: boolean
    seed: number
}

export type NatureConfig = TreeConfig | FlowerConfig | PlantConfig | RockConfig

// ══════════════════════════════════════════
//  PRESET SYSTEM
// ══════════════════════════════════════════

export interface GeneratorPreset<T> {
    id: string
    name: string
    icon: string
    category: string
    description: string
    config: T
}

// ══════════════════════════════════════════
//  DEFAULT CONFIGS
// ══════════════════════════════════════════

export const DEFAULT_FACE: FaceConfig = {
    headWidth: 0.5,
    jawWidth: 0.4,
    foreheadHeight: 0.5,
    noseLength: 0.5,
    noseWidth: 0.4,
    eyeSize: 0.5,
    eyeSpacing: 0.5,
    lipFullness: 0.5,
    earSize: 0.4,
    eyeColor: '#4A6741',
}

export const DEFAULT_CHARACTER: CharacterGenConfig = {
    name: 'Character',
    build: 'average',
    gender: 'androgynous',
    height: 1.0,
    skinTone: '#FDBCB4',
    muscularity: 0.3,
    bodyFat: 0.3,
    face: DEFAULT_FACE,
    hair: { style: 'short', color: '#2C1810', length: 1.0 },
    clothing: {
        top: 'tshirt', topColor: '#2563EB',
        bottom: 'jeans', bottomColor: '#1E3A5F',
        footwear: 'sneakers', footwearColor: '#333333',
    },
    accessories: [],
    autoRig: true,
}

export const DEFAULT_TREE: TreeConfig = {
    type: 'tree',
    species: 'oak',
    height: 5,
    trunkDiameter: 0.3,
    branchLevels: 3,
    branchesPerLevel: 3,
    branchAngle: 35,
    canopyDensity: 0.7,
    leafSize: 0.3,
    trunkColor: '#5C4033',
    leafColor: '#2D6B22',
    seed: 42,
}

export const DEFAULT_FLOWER: FlowerConfig = {
    type: 'flower',
    species: 'daisy',
    stemHeight: 0.3,
    petalCount: 12,
    petalSize: 0.05,
    petalCurl: 0.2,
    petalColor: '#FFFFFF',
    stemColor: '#3A5F0B',
    centerColor: '#FFD700',
    leafCount: 2,
    seed: 42,
}
