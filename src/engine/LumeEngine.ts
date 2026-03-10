/* ====== TrustGen — Lume Language Integration ======
 * Bridges Lume (English Mode) with TrustGen's engines.
 *
 * Three layers:
 *   1. TrustGen Domain Module — maps Lume intent verbs to engine APIs
 *   2. Script Interpreter — parses and executes Lume scripts in-browser
 *   3. Voice-to-Scene — speech → Lume English → engine commands
 *
 * Lume English Mode:
 *   "place a wooden desk in the center"
 *   → Intent: { verb: 'place', object: 'desk', material: 'wood', position: 'center' }
 *   → Engine call: scene.addObject({ shape: 'table', material: 'wood', position: [0,0,0] })
 *
 * Supports:
 *   - Scene composition (place, add, remove, move, rotate, scale)
 *   - Animation control (animate, walk, run, dance, wave)
 *   - Camera direction (pan, zoom, focus, orbit, cut-to)
 *   - Audio/narration (narrate, speak, play music, add sound)
 *   - Pipeline automation (import, render, export, publish)
 *   - TrustBook integration (import book, convert chapters)
 */

// ── Types ──

export interface LumeIntent {
    verb: string
    object?: string
    modifiers: Record<string, string | number | boolean>
    raw: string
}

export interface LumeCommand {
    intent: LumeIntent
    engineCall: string
    args: Record<string, any>
    /** Human-readable explanation of what this command does */
    explain: string
}

export interface LumeScript {
    name: string
    source: string
    commands: LumeCommand[]
    /** Compile lock hash for deterministic replay */
    compileLock?: string
}

export type LumeExecutionResult = {
    success: boolean
    command: LumeCommand
    result?: any
    error?: string
    durationMs: number
}

// ── Intent Verb Registry (TrustGen Domain) ──

interface VerbDefinition {
    aliases: string[]
    category: 'scene' | 'animation' | 'camera' | 'audio' | 'pipeline' | 'query'
    description: string
    requiredArgs: string[]
    optionalArgs: string[]
    handler: (intent: LumeIntent) => LumeCommand
}

const TRUSTGEN_VERBS: Record<string, VerbDefinition> = {
    // ── Scene Composition ──
    place: {
        aliases: ['add', 'create', 'put', 'spawn', 'insert', 'make'],
        category: 'scene',
        description: 'Add an object to the scene',
        requiredArgs: ['object'],
        optionalArgs: ['position', 'material', 'color', 'size', 'rotation'],
        handler: (intent) => ({
            intent,
            engineCall: 'scene.addObject',
            args: {
                description: intent.object || intent.raw,
                position: parsePosition(intent.modifiers.position as string),
                material: intent.modifiers.material || 'default',
                color: intent.modifiers.color,
                scale: intent.modifiers.size ? parseSize(intent.modifiers.size as string) : 1,
            },
            explain: `Add ${intent.modifiers.material ? intent.modifiers.material + ' ' : ''}${intent.object} to the scene`,
        }),
    },
    remove: {
        aliases: ['delete', 'destroy', 'clear', 'erase', 'get rid of'],
        category: 'scene',
        description: 'Remove an object from the scene',
        requiredArgs: ['object'],
        optionalArgs: [],
        handler: (intent) => ({
            intent,
            engineCall: 'scene.removeObject',
            args: { target: intent.object },
            explain: `Remove ${intent.object} from the scene`,
        }),
    },
    move: {
        aliases: ['position', 'shift', 'drag', 'slide', 'relocate'],
        category: 'scene',
        description: 'Move an object to a new position',
        requiredArgs: ['object'],
        optionalArgs: ['position', 'direction', 'distance'],
        handler: (intent) => ({
            intent,
            engineCall: 'scene.moveObject',
            args: {
                target: intent.object,
                position: parsePosition(intent.modifiers.position as string),
                direction: intent.modifiers.direction,
                distance: intent.modifiers.distance,
            },
            explain: `Move ${intent.object} to ${intent.modifiers.position || intent.modifiers.direction || 'new position'}`,
        }),
    },
    rotate: {
        aliases: ['turn', 'spin', 'twist', 'orient', 'face'],
        category: 'scene',
        description: 'Rotate an object',
        requiredArgs: ['object'],
        optionalArgs: ['angle', 'axis', 'direction'],
        handler: (intent) => ({
            intent,
            engineCall: 'scene.rotateObject',
            args: {
                target: intent.object,
                angle: intent.modifiers.angle || 90,
                axis: intent.modifiers.axis || 'y',
            },
            explain: `Rotate ${intent.object} ${intent.modifiers.angle || 90}° on ${intent.modifiers.axis || 'Y'} axis`,
        }),
    },
    scale: {
        aliases: ['resize', 'grow', 'shrink', 'enlarge', 'make bigger', 'make smaller'],
        category: 'scene',
        description: 'Change object size',
        requiredArgs: ['object'],
        optionalArgs: ['size', 'factor'],
        handler: (intent) => ({
            intent,
            engineCall: 'scene.scaleObject',
            args: {
                target: intent.object,
                factor: intent.modifiers.size || intent.modifiers.factor || 2,
            },
            explain: `Scale ${intent.object} by ${intent.modifiers.factor || intent.modifiers.size || '2x'}`,
        }),
    },
    environment: {
        aliases: ['set environment', 'use environment', 'switch to', 'set scene', 'background'],
        category: 'scene',
        description: 'Change the scene environment',
        requiredArgs: ['object'],
        optionalArgs: [],
        handler: (intent) => ({
            intent,
            engineCall: 'scene.setEnvironment',
            args: { environment: intent.object },
            explain: `Set environment to ${intent.object}`,
        }),
    },

    // ── Animation ──
    animate: {
        aliases: ['play', 'start animation', 'begin'],
        category: 'animation',
        description: 'Play an animation on a character/object',
        requiredArgs: ['object'],
        optionalArgs: ['animation', 'speed', 'loop', 'duration'],
        handler: (intent) => ({
            intent,
            engineCall: 'animation.play',
            args: {
                target: intent.object,
                animation: intent.modifiers.animation || 'idle',
                speed: intent.modifiers.speed || 1,
                loop: intent.modifiers.loop !== false,
            },
            explain: `Play ${intent.modifiers.animation || 'idle'} animation on ${intent.object}`,
        }),
    },
    walk: {
        aliases: ['walk to', 'go to', 'move to', 'approach'],
        category: 'animation',
        description: 'Make a character walk to a position',
        requiredArgs: ['object'],
        optionalArgs: ['target', 'speed'],
        handler: (intent) => ({
            intent,
            engineCall: 'animation.walkTo',
            args: {
                character: intent.object,
                target: intent.modifiers.target || intent.modifiers.position,
                speed: intent.modifiers.speed || 1,
            },
            explain: `Make ${intent.object} walk to ${intent.modifiers.target || 'target'}`,
        }),
    },

    // ── Camera ──
    pan: {
        aliases: ['camera pan', 'sweep', 'truck'],
        category: 'camera',
        description: 'Pan the camera',
        requiredArgs: [],
        optionalArgs: ['direction', 'speed', 'duration'],
        handler: (intent) => ({
            intent,
            engineCall: 'camera.pan',
            args: {
                direction: intent.modifiers.direction || 'right',
                duration: intent.modifiers.duration || 3,
            },
            explain: `Pan camera ${intent.modifiers.direction || 'right'} over ${intent.modifiers.duration || 3}s`,
        }),
    },
    zoom: {
        aliases: ['zoom in', 'zoom out', 'push in', 'pull out', 'dolly'],
        category: 'camera',
        description: 'Zoom the camera in or out',
        requiredArgs: [],
        optionalArgs: ['direction', 'amount', 'duration', 'target'],
        handler: (intent) => ({
            intent,
            engineCall: 'camera.zoom',
            args: {
                direction: intent.modifiers.direction || 'in',
                amount: intent.modifiers.amount || 2,
                duration: intent.modifiers.duration || 2,
                target: intent.object,
            },
            explain: `Zoom ${intent.modifiers.direction || 'in'} ${intent.object ? 'on ' + intent.object : ''}`,
        }),
    },
    focus: {
        aliases: ['focus on', 'look at', 'center on', 'frame'],
        category: 'camera',
        description: 'Focus the camera on an object',
        requiredArgs: ['object'],
        optionalArgs: ['shot', 'angle'],
        handler: (intent) => ({
            intent,
            engineCall: 'camera.focusOn',
            args: {
                target: intent.object,
                shotType: intent.modifiers.shot || 'medium',
                angle: intent.modifiers.angle || 'front',
            },
            explain: `Focus camera on ${intent.object} (${intent.modifiers.shot || 'medium'} shot)`,
        }),
    },
    orbit: {
        aliases: ['orbit around', 'circle', 'revolve'],
        category: 'camera',
        description: 'Orbit the camera around an object',
        requiredArgs: ['object'],
        optionalArgs: ['speed', 'duration', 'distance'],
        handler: (intent) => ({
            intent,
            engineCall: 'camera.orbit',
            args: {
                target: intent.object,
                speed: intent.modifiers.speed || 1,
                duration: intent.modifiers.duration || 5,
            },
            explain: `Orbit camera around ${intent.object}`,
        }),
    },

    // ── Audio & Narration ──
    narrate: {
        aliases: ['say', 'speak', 'voice-over', 'read aloud', 'tell'],
        category: 'audio',
        description: 'Generate AI narration',
        requiredArgs: ['object'], // object = text to narrate
        optionalArgs: ['voice', 'emotion', 'speed'],
        handler: (intent) => ({
            intent,
            engineCall: 'audio.narrate',
            args: {
                text: intent.object || intent.raw,
                voice: intent.modifiers.voice || 'narrator',
                emotion: intent.modifiers.emotion || 'neutral',
                speed: intent.modifiers.speed || 1,
            },
            explain: `Narrate: "${(intent.object || intent.raw).slice(0, 50)}..."`,
        }),
    },
    music: {
        aliases: ['play music', 'add music', 'background music', 'soundtrack'],
        category: 'audio',
        description: 'Add background music',
        requiredArgs: [],
        optionalArgs: ['genre', 'mood', 'volume'],
        handler: (intent) => ({
            intent,
            engineCall: 'audio.setMusic',
            args: {
                genre: intent.modifiers.genre || intent.object || 'ambient',
                mood: intent.modifiers.mood || 'neutral',
                volume: intent.modifiers.volume || 0.3,
            },
            explain: `Set background music to ${intent.modifiers.genre || intent.object || 'ambient'}`,
        }),
    },

    // ── Pipeline Automation ──
    render: {
        aliases: ['export', 'bake', 'finalize', 'compile video'],
        category: 'pipeline',
        description: 'Render the current scene/timeline to video',
        requiredArgs: [],
        optionalArgs: ['format', 'resolution', 'quality', 'name'],
        handler: (intent) => ({
            intent,
            engineCall: 'pipeline.render',
            args: {
                format: intent.modifiers.format || 'mp4',
                resolution: intent.modifiers.resolution || '1080p',
                quality: intent.modifiers.quality || 'high',
                name: intent.modifiers.name || intent.object || 'Untitled',
            },
            explain: `Render video "${intent.modifiers.name || intent.object || 'Untitled'}" at ${intent.modifiers.resolution || '1080p'}`,
        }),
    },
    publish: {
        aliases: ['upload', 'share', 'post', 'distribute', 'send to'],
        category: 'pipeline',
        description: 'Publish to a platform',
        requiredArgs: ['object'], // platform name
        optionalArgs: ['title', 'description'],
        handler: (intent) => ({
            intent,
            engineCall: 'pipeline.publish',
            args: {
                platform: intent.object,
                title: intent.modifiers.title,
                description: intent.modifiers.description,
            },
            explain: `Publish to ${intent.object}`,
        }),
    },
    import: {
        aliases: ['load', 'bring in', 'fetch', 'pull in', 'get'],
        category: 'pipeline',
        description: 'Import content from TrustBook or file',
        requiredArgs: ['object'],
        optionalArgs: ['source', 'chapters'],
        handler: (intent) => ({
            intent,
            engineCall: 'pipeline.import',
            args: {
                source: intent.modifiers.source || 'trustbook',
                content: intent.object,
                chapters: intent.modifiers.chapters,
            },
            explain: `Import "${intent.object}" from ${intent.modifiers.source || 'TrustBook'}`,
        }),
    },

    // ── Scene Queries ──
    describe: {
        aliases: ['what is', 'tell me about', 'show info', 'explain'],
        category: 'query',
        description: 'Describe current scene state',
        requiredArgs: [],
        optionalArgs: ['object'],
        handler: (intent) => ({
            intent,
            engineCall: 'query.describe',
            args: { target: intent.object || 'scene' },
            explain: `Describe ${intent.object || 'current scene'}`,
        }),
    },
}

// ── Intent Parser (English Mode) ──

/**
 * Parse natural language into a Lume intent.
 * This is a browser-side, lightweight version of Lume's Intent Resolver.
 */
export function parseEnglish(input: string): LumeIntent {
    const lower = input.toLowerCase().trim()

    // Find the verb
    let matchedVerb = ''
    let verbDef: VerbDefinition | null = null

    for (const [verb, def] of Object.entries(TRUSTGEN_VERBS)) {
        // Check exact verb match
        if (lower.startsWith(verb)) {
            matchedVerb = verb
            verbDef = def
            break
        }
        // Check aliases
        for (const alias of def.aliases) {
            if (lower.startsWith(alias)) {
                matchedVerb = verb
                verbDef = def
                break
            }
        }
        if (verbDef) break
    }

    if (!verbDef) {
        // Default: treat as a "place" command (create something)
        return {
            verb: 'place',
            object: input,
            modifiers: {},
            raw: input,
        }
    }

    // Extract object (first noun after verb)
    const afterVerb = lower.replace(new RegExp(`^(${matchedVerb}|${verbDef.aliases.join('|')})\\s*`, 'i'), '')
    const modifiers: Record<string, string | number | boolean> = {}

    // Extract modifiers from preposition patterns
    const patterns: [RegExp, string][] = [
        [/(?:in|at|to|on)\s+(?:the\s+)?(.+?)(?:\s+(?:with|using|and)|$)/i, 'position'],
        [/(?:with|using)\s+(?:a?\s+)?(\w+)\s+(?:material|finish|surface)/i, 'material'],
        [/(?:with|in)\s+(\w+)\s+(?:color|colour)/i, 'color'],
        [/(?:at|with)\s+(?:a?\s+)?speed\s+(?:of\s+)?(\d+(?:\.\d+)?)/i, 'speed'],
        [/(?:for|over|in)\s+(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)/i, 'duration'],
        [/(?:with|using)\s+(?:a?\s+)?(\w+)\s+voice/i, 'voice'],
        [/(?:with|in)\s+(?:a?\s+)?(\w+)\s+(?:emotion|tone|mood)/i, 'emotion'],
        [/(?:from|on)\s+(\w+)(?:\s+shot)?/i, 'angle'],
        [/(?:to|at)\s+(\d+)(?:p|px)?/i, 'resolution'],
    ]

    for (const [regex, key] of patterns) {
        const match = afterVerb.match(regex)
        if (match) modifiers[key] = match[1]
    }

    // Material keywords embedded directly
    const MATERIALS = ['wooden', 'wood', 'metal', 'metallic', 'stone', 'glass', 'gold', 'silver', 'crystal', 'neon', 'marble', 'ice']
    for (const mat of MATERIALS) {
        if (lower.includes(mat)) {
            modifiers.material = mat.replace(/en$/, '') // wooden → wood
            break
        }
    }

    // Extract the core object (noun)
    const objectWords = afterVerb
        .replace(/(?:in|at|to|on|with|using|and|the|a|an)\s+.*/i, '')
        .trim()

    return {
        verb: matchedVerb,
        object: objectWords || undefined,
        modifiers,
        raw: input,
    }
}

/**
 * Compile a Lume intent into a TrustGen engine command.
 */
export function compileIntent(intent: LumeIntent): LumeCommand {
    const verbDef = TRUSTGEN_VERBS[intent.verb]
    if (!verbDef) {
        // Fallback: treat as natural language scene description
        return TRUSTGEN_VERBS.place.handler({
            ...intent,
            verb: 'place',
            object: intent.raw,
        })
    }
    return verbDef.handler(intent)
}

/**
 * Parse and compile a full Lume script (multi-line).
 */
export function compileScript(source: string): LumeScript {
    const lines = source
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('//') && !l.startsWith('#'))

    const commands = lines.map(line => {
        const intent = parseEnglish(line)
        return compileIntent(intent)
    })

    return {
        name: 'Untitled Script',
        source,
        commands,
    }
}

// ── Script Executor ──

/**
 * Execute a compiled Lume script against the engine.
 * Each command is executed sequentially with configurable delay.
 */
export async function executeScript(
    script: LumeScript,
    executor: (command: LumeCommand) => Promise<any>,
    options: { delayMs?: number; onProgress?: (index: number, total: number, result: LumeExecutionResult) => void } = {}
): Promise<LumeExecutionResult[]> {
    const results: LumeExecutionResult[] = []
    const delay = options.delayMs ?? 200

    for (let i = 0; i < script.commands.length; i++) {
        const cmd = script.commands[i]
        const start = performance.now()
        try {
            const result = await executor(cmd)
            const execResult: LumeExecutionResult = {
                success: true,
                command: cmd,
                result,
                durationMs: performance.now() - start,
            }
            results.push(execResult)
            options.onProgress?.(i, script.commands.length, execResult)
        } catch (err: any) {
            const execResult: LumeExecutionResult = {
                success: false,
                command: cmd,
                error: err.message,
                durationMs: performance.now() - start,
            }
            results.push(execResult)
            options.onProgress?.(i, script.commands.length, execResult)
        }

        if (delay > 0 && i < script.commands.length - 1) {
            await new Promise(r => setTimeout(r, delay))
        }
    }

    return results
}

// ── Voice-to-Scene ──

/**
 * Start voice recognition for scene direction.
 * Uses Web Speech API → Lume English Mode → engine commands.
 */
export function startVoiceDirection(onCommand: (cmd: LumeCommand) => void): {
    stop: () => void
    isListening: boolean
} {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
        console.warn('Speech recognition not available')
        return { stop: () => { }, isListening: false }
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
        const last = event.results[event.results.length - 1]
        if (last.isFinal) {
            const transcript = last[0].transcript.trim()
            if (transcript) {
                const intent = parseEnglish(transcript)
                const command = compileIntent(intent)
                onCommand(command)
            }
        }
    }

    recognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error)
    }

    recognition.start()

    return {
        stop: () => recognition.stop(),
        isListening: true,
    }
}

// ── Get all available verbs (for autocomplete) ──

export function getAvailableVerbs(): { verb: string; aliases: string[]; category: string; description: string }[] {
    return Object.entries(TRUSTGEN_VERBS).map(([verb, def]) => ({
        verb,
        aliases: def.aliases,
        category: def.category,
        description: def.description,
    }))
}

// ── Helpers ──

function parsePosition(pos?: string): [number, number, number] {
    if (!pos) return [0, 0, 0]
    const p = pos.toLowerCase()
    if (p.includes('center') || p.includes('middle')) return [0, 0, 0]
    if (p.includes('left')) return [-3, 0, 0]
    if (p.includes('right')) return [3, 0, 0]
    if (p.includes('front') || p.includes('forward')) return [0, 0, 3]
    if (p.includes('back') || p.includes('behind')) return [0, 0, -3]
    if (p.includes('above') || p.includes('top') || p.includes('up')) return [0, 3, 0]
    if (p.includes('below') || p.includes('bottom')) return [0, -1, 0]
    return [0, 0, 0]
}

function parseSize(size: string): number {
    const s = size.toLowerCase()
    if (s.includes('tiny') || s.includes('small')) return 0.5
    if (s.includes('large') || s.includes('big')) return 2
    if (s.includes('huge') || s.includes('massive')) return 4
    const num = parseFloat(s)
    return isNaN(num) ? 1 : num
}
