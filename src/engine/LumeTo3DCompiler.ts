/* ====== TrustGen — Lume-to-3D Compiler ======
 * Compiles Lume scene DSL into TrustGen SceneGraph objects.
 * Reuses OBJECT_TEMPLATES and MATERIAL_MAP from TextTo3DGenerator.
 *
 * Supports both English Mode and Structured Mode:
 *
 * English Mode:
 *   create a wooden table at center
 *   place a golden crown on the table
 *   add a glowing crystal behind the crown
 *
 * Structured Mode:
 *   let table = create "table" with material "oak" at (0, 0, 0)
 *   let crown = create "crown" with material "gold" at (0, 0.8, 0)
 *
 * Pipeline: Lume Source → Tokenize → Parse → Resolve → SceneGraph
 * All stages deterministic per Lume Doctrine.
 */
import { parseDescriptionLocal, type SceneGraph, type SceneGraphNode } from './TextTo3DGenerator'

// ══════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════

export interface LumeCommand {
    verb: string          // create, place, add, set, remove, export
    object: string        // "table", "sword", "crystal"
    material?: string     // "oak", "gold", "neon"
    color?: string        // "red", "#FF0000"
    position?: { x: number; y: number; z: number }
    rotation?: { x: number; y: number; z: number }
    scale?: number
    name?: string         // variable name for reference
    reference?: string    // "on the table", "behind the crown"
    raw: string           // original line
}

export interface CompileResult {
    success: boolean
    sceneGraph: SceneGraph | null
    commands: LumeCommand[]
    errors: CompileError[]
    warnings: string[]
}

export interface CompileError {
    line: number
    message: string
    suggestion: string
}

// ══════════════════════════════════════════
//  SPATIAL KEYWORDS
// ══════════════════════════════════════════

const SPATIAL_MAP: Record<string, { x: number; y: number; z: number }> = {
    'center': { x: 0, y: 0, z: 0 },
    'origin': { x: 0, y: 0, z: 0 },
    'left': { x: -2, y: 0, z: 0 },
    'right': { x: 2, y: 0, z: 0 },
    'front': { x: 0, y: 0, z: 2 },
    'back': { x: 0, y: 0, z: -2 },
    'behind': { x: 0, y: 0, z: -1 },
    'above': { x: 0, y: 2, z: 0 },
    'below': { x: 0, y: -1, z: 0 },
    'far left': { x: -4, y: 0, z: 0 },
    'far right': { x: 4, y: 0, z: 0 },
    'near': { x: 0, y: 0, z: 1 },
    'top': { x: 0, y: 2, z: 0 },
}

const RELATIVE_OFFSETS: Record<string, { x: number; y: number; z: number }> = {
    'on': { x: 0, y: 0.8, z: 0 },
    'on top of': { x: 0, y: 1.0, z: 0 },
    'above': { x: 0, y: 1.5, z: 0 },
    'below': { x: 0, y: -1, z: 0 },
    'under': { x: 0, y: -0.5, z: 0 },
    'behind': { x: 0, y: 0, z: -1.5 },
    'in front of': { x: 0, y: 0, z: 1.5 },
    'left of': { x: -1.5, y: 0, z: 0 },
    'right of': { x: 1.5, y: 0, z: 0 },
    'next to': { x: 1.2, y: 0, z: 0 },
    'beside': { x: 1.2, y: 0, z: 0 },
    'near': { x: 0.8, y: 0, z: 0.8 },
    'around': { x: 1, y: 0, z: 1 },
}

const COLOR_NAMES: Record<string, string> = {
    red: '#CC0000', blue: '#0066CC', green: '#228B22', yellow: '#FFD700',
    purple: '#800080', orange: '#FF8C00', pink: '#FF69B4', black: '#1C1C1C',
    white: '#F5F5F5', cyan: '#00CED1', teal: '#008080', gold: '#FFD700',
    silver: '#C0C0C0', bronze: '#CD7F32', copper: '#B87333',
}

// ══════════════════════════════════════════
//  VERB PATTERNS (Lume Tolerance Chain Layer 1-4)
// ══════════════════════════════════════════

const CREATION_VERBS = ['create', 'make', 'add', 'place', 'put', 'generate', 'spawn', 'build']
const MODIFICATION_VERBS = ['set', 'change', 'modify', 'update', 'adjust', 'make']
const REMOVAL_VERBS = ['remove', 'delete', 'destroy', 'clear']
const SCENE_VERBS = ['set lighting', 'set environment', 'set background', 'set mood']

// ══════════════════════════════════════════
//  TOKENIZER
// ══════════════════════════════════════════

function tokenizeLine(line: string): { verb: string; rest: string } | null {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('mode:')) return null

    const lower = trimmed.toLowerCase()

    // Check scene verbs first (multi-word)
    for (const sv of SCENE_VERBS) {
        if (lower.startsWith(sv)) {
            return { verb: sv, rest: lower.slice(sv.length).trim() }
        }
    }

    // Check structured: let name = verb "object" ...
    const structuredMatch = lower.match(/^(?:let\s+(\w+)\s*=\s*)?(\w+)\s+(.*)$/)
    if (structuredMatch) {
        const [, varName, verb, rest] = structuredMatch
        if (CREATION_VERBS.includes(verb) || MODIFICATION_VERBS.includes(verb) || REMOVAL_VERBS.includes(verb)) {
            return { verb, rest: (varName ? `@${varName} ` : '') + rest }
        }
    }

    return null
}

// ══════════════════════════════════════════
//  PARSER
// ══════════════════════════════════════════

function parseCreationCommand(verb: string, rest: string): LumeCommand {
    const cmd: LumeCommand = { verb, object: '', raw: `${verb} ${rest}` }

    // Extract variable name
    const varMatch = rest.match(/^@(\w+)\s+/)
    if (varMatch) {
        cmd.name = varMatch[1]
        rest = rest.slice(varMatch[0].length)
    }

    // Extract position: at (x, y, z) or at center
    const posMatch = rest.match(/at\s+\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/)
    if (posMatch) {
        cmd.position = { x: parseFloat(posMatch[1]), y: parseFloat(posMatch[2]), z: parseFloat(posMatch[3]) }
        rest = rest.replace(posMatch[0], '')
    } else {
        // Named position: "at center", "at left"
        const namedPosMatch = rest.match(/at\s+([\w\s]+?)(?:\s+(?:with|and|$))/i)
        if (namedPosMatch) {
            const posName = namedPosMatch[1].trim().toLowerCase()
            if (SPATIAL_MAP[posName]) {
                cmd.position = { ...SPATIAL_MAP[posName] }
                rest = rest.replace(namedPosMatch[0], ' ')
            }
        }
    }

    // Extract relative position: "on the table", "behind the crown"
    for (const [prep, offset] of Object.entries(RELATIVE_OFFSETS)) {
        const relMatch = rest.match(new RegExp(`${prep}\\s+(?:the\\s+)?(\\w+)`, 'i'))
        if (relMatch) {
            cmd.reference = `${prep} ${relMatch[1]}`
            if (!cmd.position) cmd.position = { ...offset }
            rest = rest.replace(relMatch[0], '')
            break
        }
    }

    // Extract material: with material "oak" or just "wooden", "golden" etc
    const matMatch = rest.match(/with\s+material\s+"?(\w+)"?/i) || rest.match(/with\s+"?(\w+)"?\s+material/i)
    if (matMatch) {
        cmd.material = matMatch[1]
        rest = rest.replace(matMatch[0], '')
    }

    // Extract adjective materials (wooden → wood, golden → gold, etc)
    const adjMaterials: Record<string, string> = {
        wooden: 'wood', golden: 'gold', silver: 'silver', stone: 'stone', metallic: 'metal',
        iron: 'iron', steel: 'steel', glass: 'glass', crystal: 'crystal', marble: 'marble',
        concrete: 'concrete', brick: 'brick', leather: 'leather', neon: 'neon', glowing: 'glowing',
        copper: 'copper', bronze: 'bronze', obsidian: 'obsidian', jade: 'jade',
    }
    for (const [adj, mat] of Object.entries(adjMaterials)) {
        if (rest.includes(adj) && !cmd.material) {
            cmd.material = mat
            break
        }
    }

    // Extract color
    for (const [name, hex] of Object.entries(COLOR_NAMES)) {
        if (rest.includes(name)) {
            cmd.color = hex
            break
        }
    }
    const hexMatch = rest.match(/#[0-9a-fA-F]{6}/)
    if (hexMatch) cmd.color = hexMatch[0]

    // Extract scale
    const scaleMatch = rest.match(/scale\s+([\d.]+)/i) || rest.match(/([\d.]+)x\s+(?:size|scale)/i)
    if (scaleMatch) cmd.scale = parseFloat(scaleMatch[1])

    // Extract object name (strip articles, prepositions, quotes)
    let objStr = rest
        .replace(/\b(a|an|the|some|with|and|at|in|on|to)\b/gi, '')
        .replace(/"([^"]+)"/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()

    // The first remaining noun is the object
    const words = objStr.split(/\s+/).filter(w => w.length > 1)
    cmd.object = words[0] || 'cube'

    return cmd
}

// ══════════════════════════════════════════
//  SCENE GRAPH BUILDER
// ══════════════════════════════════════════

function commandToSceneNodes(cmd: LumeCommand): SceneGraphNode[] {
    // Build a description string that the existing parser can handle
    const parts: string[] = [cmd.object]
    if (cmd.material) parts.push(cmd.material)
    if (cmd.color) {
        // Find color name from hex
        const colorName = Object.entries(COLOR_NAMES).find(([, h]) => h === cmd.color)?.[0]
        if (colorName) parts.push(colorName)
    }

    const description = parts.join(' ')
    const sg = parseDescriptionLocal(description)

    // Apply position
    if (cmd.position) {
        const offsetX = cmd.position.x
        const offsetY = cmd.position.y
        const offsetZ = cmd.position.z
        sg.objects.forEach(o => {
            o.position.x += offsetX
            o.position.y += offsetY
            o.position.z += offsetZ
        })
    }

    // Apply scale
    if (cmd.scale) {
        sg.objects.forEach(o => {
            o.size.x *= cmd.scale!
            o.size.y *= cmd.scale!
            o.size.z *= cmd.scale!
        })
    }

    // Apply color override
    if (cmd.color) {
        sg.objects.forEach(o => { o.material.color = cmd.color! })
    }

    return sg.objects
}

// ══════════════════════════════════════════
//  MAIN COMPILER
// ══════════════════════════════════════════

export function compileLume(source: string): CompileResult {
    const lines = source.split('\n')
    const commands: LumeCommand[] = []
    const errors: CompileError[] = []
    const warnings: string[] = []
    const allObjects: SceneGraphNode[] = []
    const namedObjects = new Map<string, SceneGraphNode[]>()

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1
        const token = tokenizeLine(lines[i])
        if (!token) continue

        try {
            if (CREATION_VERBS.includes(token.verb)) {
                const cmd = parseCreationCommand(token.verb, token.rest)
                commands.push(cmd)

                // Resolve relative references
                if (cmd.reference && !cmd.position) {
                    for (const [prep, offset] of Object.entries(RELATIVE_OFFSETS)) {
                        if (cmd.reference.startsWith(prep)) {
                            const refName = cmd.reference.slice(prep.length).trim()
                            const refNodes = namedObjects.get(refName)
                            if (refNodes && refNodes.length > 0) {
                                const refPos = refNodes[0].position
                                cmd.position = {
                                    x: refPos.x + offset.x,
                                    y: refPos.y + offset.y,
                                    z: refPos.z + offset.z,
                                }
                            }
                        }
                    }
                }

                const nodes = commandToSceneNodes(cmd)
                allObjects.push(...nodes)

                if (cmd.name) {
                    namedObjects.set(cmd.name, nodes)
                }
                // Also store by object type for relative references
                namedObjects.set(cmd.object, nodes)

            } else if (SCENE_VERBS.some(sv => token.verb.startsWith(sv.split(' ')[0]))) {
                // Scene-level commands (lighting, env) — store as metadata
                warnings.push(`Line ${lineNum}: Scene command "${token.verb}" noted but not yet rendered`)
            } else if (REMOVAL_VERBS.includes(token.verb)) {
                warnings.push(`Line ${lineNum}: Remove command noted — objects won't appear in output`)
            } else {
                errors.push({
                    line: lineNum,
                    message: `Unknown verb: "${token.verb}"`,
                    suggestion: `Try using: ${CREATION_VERBS.slice(0, 4).join(', ')}`,
                })
            }
        } catch (e: any) {
            errors.push({
                line: lineNum,
                message: e.message,
                suggestion: 'Check that the object name matches a known template (table, sword, tree, robot, etc.)',
            })
        }
    }

    if (allObjects.length === 0 && errors.length === 0) {
        warnings.push('No objects created. Try: create a wooden table at center')
    }

    const sceneGraph: SceneGraph = {
        description: `Lume scene (${commands.length} commands)`,
        objects: allObjects,
    }

    return {
        success: errors.length === 0,
        sceneGraph: allObjects.length > 0 ? sceneGraph : null,
        commands,
        errors,
        warnings,
    }
}

// ══════════════════════════════════════════
//  EXAMPLE SCRIPTS
// ══════════════════════════════════════════

export const LUME_EXAMPLES: { name: string; code: string }[] = [
    {
        name: 'Royal Display',
        code: `// Royal Display — Lume-to-3D
create a wooden table at center
place a golden crown on the table
add a crystal behind the crown`,
    },
    {
        name: 'Battle Scene',
        code: `// Battle Scene — Lume-to-3D
create a steel sword at left
create a iron shield at right
create a stone pillar at back
place a golden gem on the pillar`,
    },
    {
        name: 'Forest Clearing',
        code: `// Forest Clearing — Lume-to-3D
create a tree at left
create a tree at right
create a tree at back
add a stone barrel at center
place a glowing gem on the barrel`,
    },
    {
        name: 'Robot Workshop',
        code: `// Robot Workshop — Lume-to-3D
create a robot at center
add a metal table at right
place a neon crystal on the table
create a steel barrel at left`,
    },
    {
        name: 'Throne Room',
        code: `// Throne Room — Lume-to-3D
create a golden chair at center
create a stone pillar at left
create a stone pillar at right
place a glowing crown on the chair
add a iron shield at back`,
    },
]
