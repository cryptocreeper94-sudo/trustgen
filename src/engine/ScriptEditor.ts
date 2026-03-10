/* ====== TrustGen — Script Editor / Storyboard ======
 * Write scripts and create storyboards for cinematic sequences.
 *
 * - Scene/shot-based script writing (screenplay format)
 * - Storyboard panels with text notes and shot references
 * - Auto-generate shots from script descriptions
 * - Character dialogue tracking
 * - Export to PDF-like format
 */

// ── Types ──

export type ScriptElementType = 'scene-heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'note'

export interface ScriptElement {
    id: string
    type: ScriptElementType
    text: string
    /** Linked shot ID (for scene headings and transitions) */
    linkedShotId?: string
    /** Character name (for dialogue) */
    characterName?: string
    /** Timestamp hint */
    timestamp?: number
}

export interface StoryboardPanel {
    id: string
    /** Panel number (display order) */
    panelNumber: number
    /** Description of the visual */
    description: string
    /** Camera / framing notes */
    cameraNote: string
    /** Action / movement notes */
    actionNote: string
    /** Dialogue overlay */
    dialogue: string
    /** Duration hint (seconds) */
    duration: number
    /** Linked shot ID */
    linkedShotId?: string
    /** Thumbnail image (generated or uploaded) */
    thumbnailUrl?: string
    /** Panel aspect ratio */
    aspectRatio: '16:9' | '2.39:1' | '4:3' | '1:1'
}

export interface ScriptDocument {
    id: string
    title: string
    author: string
    genre: string
    logline: string
    elements: ScriptElement[]
    storyboard: StoryboardPanel[]
    characters: CharacterEntry[]
    createdAt: number
    updatedAt: number
}

export interface CharacterEntry {
    name: string
    description: string
    color: string  // for dialogue highlighting
}

// ── Defaults ──

let elementCounter = 0
let panelCounter = 0

export function createScriptElement(type: ScriptElementType, text: string = ''): ScriptElement {
    elementCounter++
    return {
        id: `se_${Date.now()}_${elementCounter}`,
        type,
        text,
    }
}

export function createStoryboardPanel(overrides?: Partial<StoryboardPanel>): StoryboardPanel {
    panelCounter++
    return {
        id: `sp_${Date.now()}_${panelCounter}`,
        panelNumber: panelCounter,
        description: '',
        cameraNote: '',
        actionNote: '',
        dialogue: '',
        duration: 3,
        aspectRatio: '16:9',
        ...overrides,
    }
}

export function createDefaultScript(): ScriptDocument {
    return {
        id: `script_${Date.now()}`,
        title: 'Untitled Script',
        author: '',
        genre: '',
        logline: '',
        elements: [
            createScriptElement('scene-heading', 'INT. STUDIO - DAY'),
            createScriptElement('action', 'The camera slowly reveals the scene.'),
        ],
        storyboard: [
            createStoryboardPanel({ description: 'Opening wide shot of the environment', cameraNote: 'Slow orbit', duration: 4 }),
        ],
        characters: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }
}

// ── Screenplay Formatting ──

const FORMAT_RULES: Record<ScriptElementType, { prefix: string; uppercase: boolean; indent: number }> = {
    'scene-heading': { prefix: '', uppercase: true, indent: 0 },
    'action': { prefix: '', uppercase: false, indent: 0 },
    'character': { prefix: '', uppercase: true, indent: 22 },
    'dialogue': { prefix: '', uppercase: false, indent: 11 },
    'parenthetical': { prefix: '(', uppercase: false, indent: 16 },
    'transition': { prefix: '', uppercase: true, indent: 45 },
    'note': { prefix: '[[', uppercase: false, indent: 0 },
}

/**
 * Format a script element for display in screenplay format.
 */
export function formatElement(element: ScriptElement): string {
    const rule = FORMAT_RULES[element.type]
    let text = element.text

    if (rule.uppercase) text = text.toUpperCase()
    if (rule.prefix) text = `${rule.prefix}${text}`
    if (element.type === 'parenthetical') text = `(${element.text})`
    if (element.type === 'note') text = `[[${element.text}]]`

    return text
}

/**
 * Export the full script as formatted plain text (screenplay format).
 */
export function exportAsScreenplay(doc: ScriptDocument): string {
    const lines: string[] = []

    // Title page
    lines.push('')
    lines.push(doc.title.toUpperCase())
    lines.push('')
    if (doc.author) lines.push(`Written by ${doc.author}`)
    if (doc.logline) lines.push('', doc.logline)
    lines.push('', '---', '')

    for (const el of doc.elements) {
        const formatted = formatElement(el)
        const rule = FORMAT_RULES[el.type]
        const indent = ' '.repeat(rule.indent)

        if (el.type === 'scene-heading') {
            lines.push('') // blank line before scene headings
        }

        lines.push(`${indent}${formatted}`)

        if (el.type === 'scene-heading' || el.type === 'transition') {
            lines.push('') // blank line after
        }
    }

    return lines.join('\n')
}

/**
 * Parse a plain-text screenplay into script elements.
 * Basic heuristic parsing based on indentation and keywords.
 */
export function parseScreenplay(text: string): ScriptElement[] {
    const lines = text.split('\n')
    const elements: ScriptElement[] = []

    for (const raw of lines) {
        const line = raw.trim()
        if (!line) continue

        // Scene headings: start with INT., EXT., INT/EXT.
        if (/^(INT\.|EXT\.|INT\/EXT\.)/.test(line.toUpperCase())) {
            elements.push(createScriptElement('scene-heading', line))
        }
        // Transitions: end with "TO:" or "CUT TO:", "FADE IN:", etc.
        else if (/\b(CUT TO|FADE (IN|OUT|TO)|DISSOLVE TO|SMASH CUT|MATCH CUT)\s*:?\s*$/i.test(line)) {
            elements.push(createScriptElement('transition', line))
        }
        // Parenthetical: starts with (
        else if (line.startsWith('(') && line.endsWith(')')) {
            elements.push(createScriptElement('parenthetical', line.slice(1, -1)))
        }
        // Notes: wrapped in [[ ]]
        else if (line.startsWith('[[') && line.endsWith(']]')) {
            elements.push(createScriptElement('note', line.slice(2, -2)))
        }
        // Character: all caps, no period, relatively short
        else if (line === line.toUpperCase() && line.length < 40 && !line.includes('.')) {
            elements.push(createScriptElement('character', line))
        }
        // Everything else: action or dialogue (context dependent)
        else {
            const lastType = elements[elements.length - 1]?.type
            if (lastType === 'character' || lastType === 'parenthetical') {
                elements.push(createScriptElement('dialogue', line))
            } else {
                elements.push(createScriptElement('action', line))
            }
        }
    }

    return elements
}

/**
 * Auto-generate storyboard panels from script elements.
 * Creates one panel per scene heading.
 */
export function generateStoryboardFromScript(elements: ScriptElement[]): StoryboardPanel[] {
    const panels: StoryboardPanel[] = []
    let currentDesc = ''
    let currentDialogue = ''

    for (const el of elements) {
        if (el.type === 'scene-heading') {
            // Save previous panel
            if (currentDesc || currentDialogue) {
                panels.push(createStoryboardPanel({
                    description: currentDesc.trim(),
                    dialogue: currentDialogue.trim(),
                    linkedShotId: el.linkedShotId,
                }))
            }
            currentDesc = el.text
            currentDialogue = ''
        } else if (el.type === 'action') {
            currentDesc += '\n' + el.text
        } else if (el.type === 'dialogue') {
            const character = elements[elements.indexOf(el) - 1]
            const prefix = character?.type === 'character' ? `${character.text}: ` : ''
            currentDialogue += prefix + el.text + '\n'
        }
    }

    // Final panel
    if (currentDesc || currentDialogue) {
        panels.push(createStoryboardPanel({
            description: currentDesc.trim(),
            dialogue: currentDialogue.trim(),
        }))
    }

    return panels
}
