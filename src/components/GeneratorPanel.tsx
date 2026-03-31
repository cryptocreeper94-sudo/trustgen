/* ====== TrustGen — Generator Panel ======
 * Ultra-premium tabbed UI for procedural generation.
 * Tabs: Characters · Creatures · Nature
 * Features: Preset gallery, parameter sliders, live preview, auto-rig toggle.
 *
 * Trust Layer dark glassmorphism aesthetic — void black, cyan accents, orb effects.
 */
import React, { useState, useCallback } from 'react'
import type {
    CharacterGenConfig, BodyBuild, Gender, HairType, TopClothing, BottomClothing,
    FootwearType, CreatureConfig, QuadrupedConfig, BirdConfig,
    FishConfig, NatureConfig, TreeConfig, FlowerConfig,
    RockConfig, GeneratorPreset,
} from '../engine/generators/GeneratorTypes'
import { DEFAULT_CHARACTER } from '../engine/generators/GeneratorTypes'
import { CHARACTER_PRESETS } from '../engine/CharacterCreator'
import { QUADRUPED_PRESETS, BIRD_PRESETS, FISH_PRESETS, INSECT_PRESETS } from '../engine/generators/CreatureGenerator'
import { TREE_PRESETS, FLOWER_PRESETS, PLANT_PRESETS, ROCK_PRESETS } from '../engine/generators/NatureGenerator'

// ══════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════

type GeneratorTab = 'characters' | 'creatures' | 'nature'
type CreatureSubTab = 'quadruped' | 'bird' | 'fish' | 'insect'
type NatureSubTab = 'tree' | 'flower' | 'plant' | 'rock'

interface GeneratorPanelProps {
    onGenerate: (type: string, config: CharacterGenConfig | CreatureConfig | NatureConfig) => void
    onPreview?: (type: string, config: CharacterGenConfig | CreatureConfig | NatureConfig) => void
}

// ══════════════════════════════════════════
//  UI SUBCOMPONENTS
// ══════════════════════════════════════════

const Slider: React.FC<{
    label: string; value: number; min?: number; max?: number; step?: number;
    onChange: (v: number) => void; suffix?: string
}> = ({ label, value, min = 0, max = 1, step = 0.01, onChange, suffix }) => (
    <div style={styles.sliderRow}>
        <label style={styles.sliderLabel}>{label}</label>
        <input
            type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            style={styles.slider}
        />
        <span style={styles.sliderValue}>{typeof value === 'number' ? value.toFixed(step >= 1 ? 0 : 2) : value}{suffix || ''}</span>
    </div>
)

const ColorPicker: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
    <div style={styles.sliderRow}>
        <label style={styles.sliderLabel}>{label}</label>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} style={styles.colorInput} />
        <span style={styles.sliderValue}>{value}</span>
    </div>
)

const Select: React.FC<{
    label: string; value: string; options: { value: string; label: string }[];
    onChange: (v: string) => void
}> = ({ label, value, options, onChange }) => (
    <div style={styles.sliderRow}>
        <label style={styles.sliderLabel}>{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} style={styles.select}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
)

// Photorealistic + Pixar-style preset thumbnails
const PRESET_IMAGES: Record<string, string> = {
    // Realistic characters
    warrior: '/presets/warrior.png',
    athlete: '/presets/athlete.png',
    casual: '/presets/casual.png',
    executive: '/presets/business.png',
    narrator: '/presets/business.png',
    presenter: '/presets/business.png',
    scientist: '/presets/sci-fi.png',
    child: '/presets/casual.png',
    // Pixar-style characters
    'pixar-hero': '/presets/pixar-hero.png',
    'pixar-girl': '/presets/pixar-girl.png',
    'pixar-robot': '/presets/pixar-robot.png',
    'pixar-villain': '/presets/pixar-villain.png',
    'pixar-fox': '/presets/pixar-fox.png',
    hero: '/presets/pixar-hero.png',
    adventurer: '/presets/pixar-girl.png',
    robot: '/presets/pixar-robot.png',
    villain: '/presets/pixar-villain.png',
    // Creatures
    wolf: '/presets/wolf.png',
    dog: '/presets/wolf.png',
    cat: '/presets/wolf.png',
    horse: '/presets/wolf.png',
    bear: '/presets/wolf.png',
    fox: '/presets/pixar-fox.png',
    eagle: '/presets/eagle.png',
    parrot: '/presets/eagle.png',
    dragon: '/presets/dragon.png',
    butterfly: '/presets/eagle.png',
    // Nature
    oak: '/presets/oak-tree.png',
    pine: '/presets/oak-tree.png',
    palm: '/presets/oak-tree.png',
    bamboo: '/presets/oak-tree.png',
    crystal: '/presets/crystal-rock.png',
    granite: '/presets/crystal-rock.png',
    sandstone: '/presets/crystal-rock.png',
    obsidian: '/presets/crystal-rock.png',
}

const PresetCard: React.FC<{
    preset: GeneratorPreset<any>; selected: boolean; onClick: () => void
}> = ({ preset, selected, onClick }) => {
    const imgSrc = PRESET_IMAGES[preset.id] || PRESET_IMAGES[preset.name?.toLowerCase()] || null
    return (
        <button onClick={onClick} style={{ ...styles.presetCard, ...(selected ? styles.presetCardActive : {}), padding: 0, overflow: 'hidden' }}>
            {imgSrc ? (
                <div style={styles.presetImageWrap}>
                    <img src={imgSrc} alt={preset.name} style={styles.presetImage} draggable={false} />
                    <div style={styles.presetImageOverlay} />
                </div>
            ) : (
                <span style={styles.presetIcon}>{preset.icon}</span>
            )}
            <span style={{ ...styles.presetName, padding: '4px 2px 6px' }}>{preset.name}</span>
        </button>
    )
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div style={styles.sectionHeader}>
        <span style={styles.sectionDot} />
        <span style={styles.sectionTitle}>{title}</span>
    </div>
)

// ══════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════

const GeneratorPanel: React.FC<GeneratorPanelProps> = ({ onGenerate }) => {
    const [tab, setTab] = useState<GeneratorTab>('characters')
    const [creatureSub, setCreatureSub] = useState<CreatureSubTab>('quadruped')
    const [natureSub, setNatureSub] = useState<NatureSubTab>('tree')
    const [autoRig, setAutoRig] = useState(true)
    const [showJoints, setShowJoints] = useState(true)

    // Character state
    const [charConfig, setCharConfig] = useState<CharacterGenConfig>({ ...DEFAULT_CHARACTER })
    const [selectedCharPreset, setSelectedCharPreset] = useState<string | null>(null)

    // Creature state
    const [creatureConfig, setCreatureConfig] = useState<CreatureConfig>(QUADRUPED_PRESETS[0].config)
    const [selectedCreaturePreset, setSelectedCreaturePreset] = useState<string | null>(QUADRUPED_PRESETS[0].id)

    // Nature state
    const [natureConfig, setNatureConfig] = useState<NatureConfig>(TREE_PRESETS[0].config)
    const [selectedNaturePreset, setSelectedNaturePreset] = useState<string | null>(TREE_PRESETS[0].id)

    const updateChar = useCallback((patch: Partial<CharacterGenConfig>) => {
        setCharConfig(prev => ({ ...prev, ...patch }))
        setSelectedCharPreset(null)
    }, [])

    const updateCharFace = useCallback((patch: Partial<CharacterGenConfig['face']>) => {
        setCharConfig(prev => ({ ...prev, face: { ...prev.face, ...patch } }))
        setSelectedCharPreset(null)
    }, [])

    const updateCharHair = useCallback((patch: Partial<CharacterGenConfig['hair']>) => {
        setCharConfig(prev => ({ ...prev, hair: { ...prev.hair, ...patch } }))
        setSelectedCharPreset(null)
    }, [])

    const updateCharClothing = useCallback((patch: Partial<CharacterGenConfig['clothing']>) => {
        setCharConfig(prev => ({ ...prev, clothing: { ...prev.clothing, ...patch } }))
        setSelectedCharPreset(null)
    }, [])

    const handleGenerate = useCallback(() => {
        if (tab === 'characters') onGenerate('character', { ...charConfig, autoRig })
        else if (tab === 'creatures') onGenerate('creature', creatureConfig)
        else onGenerate('nature', natureConfig)
    }, [tab, charConfig, creatureConfig, natureConfig, autoRig, onGenerate])

    const handleRandomize = useCallback(() => {
        const seed = Date.now()
        if (tab === 'characters') {
            const preset = CHARACTER_PRESETS[Math.floor(Math.random() * CHARACTER_PRESETS.length)]
            setCharConfig({ ...preset.config })
            setSelectedCharPreset(preset.id)
        } else if (tab === 'creatures') {
            const allPresets = creatureSub === 'quadruped' ? QUADRUPED_PRESETS
                : creatureSub === 'bird' ? BIRD_PRESETS
                    : creatureSub === 'fish' ? FISH_PRESETS : INSECT_PRESETS
            const preset = allPresets[Math.floor(Math.random() * allPresets.length)]
            setCreatureConfig(preset.config)
            setSelectedCreaturePreset(preset.id)
        } else {
            const allPresets = natureSub === 'tree' ? TREE_PRESETS
                : natureSub === 'flower' ? FLOWER_PRESETS
                    : natureSub === 'plant' ? PLANT_PRESETS : ROCK_PRESETS
            const preset = allPresets[Math.floor(Math.random() * allPresets.length)]
            setNatureConfig({ ...preset.config, seed } as any)
            setSelectedNaturePreset(preset.id)
        }
    }, [tab, creatureSub, natureSub])

    // ══════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════

    return (
        <div style={styles.panel}>
            {/* ── Header ── */}
            <div style={styles.header}>
                <div style={styles.orb} />
                <h2 style={styles.title}>Procedural Generator</h2>
                <span style={styles.badge}>IN-HOUSE</span>
            </div>

            {/* ── Tab Bar ── */}
            <div style={styles.tabBar}>
                {(['characters', 'creatures', 'nature'] as GeneratorTab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
                    >
                        {t === 'characters' ? '🧍' : t === 'creatures' ? '🐾' : '🌿'}
                        <span style={styles.tabLabel}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                    </button>
                ))}
            </div>

            {/* ── Scrollable Content ── */}
            <div style={styles.content}>
                {/* ════════════════════════════════════
                    CHARACTER TAB
                   ════════════════════════════════════ */}
                {tab === 'characters' && (
                    <>
                        <SectionHeader title="Presets" />
                        <div style={styles.presetGrid}>
                            {CHARACTER_PRESETS.map(p => (
                                <PresetCard
                                    key={p.id} preset={p}
                                    selected={selectedCharPreset === p.id}
                                    onClick={() => { setCharConfig({ ...p.config }); setSelectedCharPreset(p.id) }}
                                />
                            ))}
                        </div>

                        <SectionHeader title="Body" />
                        <Select label="Build" value={charConfig.build}
                            options={(['slim', 'average', 'athletic', 'stocky', 'heavy', 'child', 'stylized'] as BodyBuild[]).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))}
                            onChange={v => updateChar({ build: v as BodyBuild })} />
                        <Select label="Gender" value={charConfig.gender}
                            options={(['masculine', 'feminine', 'androgynous'] as Gender[]).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))}
                            onChange={v => updateChar({ gender: v as Gender })} />
                        <Slider label="Height" value={charConfig.height} min={0.5} max={1.4} step={0.05} onChange={v => updateChar({ height: v })} suffix="x" />
                        <Slider label="Muscularity" value={charConfig.muscularity} onChange={v => updateChar({ muscularity: v })} />
                        <Slider label="Body Fat" value={charConfig.bodyFat} onChange={v => updateChar({ bodyFat: v })} />
                        <ColorPicker label="Skin Tone" value={charConfig.skinTone} onChange={v => updateChar({ skinTone: v })} />

                        <SectionHeader title="Face" />
                        <Slider label="Head Width" value={charConfig.face.headWidth} onChange={v => updateCharFace({ headWidth: v })} />
                        <Slider label="Jaw Width" value={charConfig.face.jawWidth} onChange={v => updateCharFace({ jawWidth: v })} />
                        <Slider label="Forehead" value={charConfig.face.foreheadHeight} onChange={v => updateCharFace({ foreheadHeight: v })} />
                        <Slider label="Nose Length" value={charConfig.face.noseLength} onChange={v => updateCharFace({ noseLength: v })} />
                        <Slider label="Eye Size" value={charConfig.face.eyeSize} onChange={v => updateCharFace({ eyeSize: v })} />
                        <Slider label="Lip Fullness" value={charConfig.face.lipFullness} onChange={v => updateCharFace({ lipFullness: v })} />
                        <ColorPicker label="Eye Color" value={charConfig.face.eyeColor} onChange={v => updateCharFace({ eyeColor: v })} />

                        <SectionHeader title="Hair" />
                        <Select label="Style" value={charConfig.hair.style}
                            options={(['none', 'buzz', 'short', 'medium', 'long', 'afro', 'mohawk', 'bun', 'ponytail', 'braids', 'curly'] as HairType[]).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))}
                            onChange={v => updateCharHair({ style: v as HairType })} />
                        <ColorPicker label="Color" value={charConfig.hair.color} onChange={v => updateCharHair({ color: v })} />
                        <Slider label="Length" value={charConfig.hair.length} min={0.3} max={2} step={0.1} onChange={v => updateCharHair({ length: v })} />

                        <SectionHeader title="Clothing" />
                        <Select label="Top" value={charConfig.clothing.top}
                            options={(['none', 'tshirt', 'button-shirt', 'jacket', 'hoodie', 'tank-top', 'suit', 'vest', 'coat', 'armor'] as TopClothing[]).map(v => ({ value: v, label: v.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
                            onChange={v => updateCharClothing({ top: v as TopClothing })} />
                        <ColorPicker label="Top Color" value={charConfig.clothing.topColor} onChange={v => updateCharClothing({ topColor: v })} />
                        <Select label="Bottom" value={charConfig.clothing.bottom}
                            options={(['none', 'jeans', 'slacks', 'shorts', 'skirt', 'sweats', 'cargo', 'armor-legs'] as BottomClothing[]).map(v => ({ value: v, label: v.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
                            onChange={v => updateCharClothing({ bottom: v as BottomClothing })} />
                        <ColorPicker label="Bottom Color" value={charConfig.clothing.bottomColor} onChange={v => updateCharClothing({ bottomColor: v })} />
                        <Select label="Shoes" value={charConfig.clothing.footwear}
                            options={(['none', 'shoes', 'boots', 'sandals', 'sneakers', 'heels', 'armor-boots'] as FootwearType[]).map(v => ({ value: v, label: v.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
                            onChange={v => updateCharClothing({ footwear: v as FootwearType })} />

                        <SectionHeader title="Rig" />
                        <div style={styles.toggleRow}>
                            <label style={styles.sliderLabel}>Auto-Rig Skeleton</label>
                            <button onClick={() => setAutoRig(!autoRig)} style={{ ...styles.toggleBtn, ...(autoRig ? styles.toggleOn : {}) }}>
                                {autoRig ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        <div style={styles.toggleRow}>
                            <label style={styles.sliderLabel}>Show Hinge Points</label>
                            <button onClick={() => setShowJoints(!showJoints)} style={{ ...styles.toggleBtn, ...(showJoints ? styles.toggleOn : {}) }}>
                                {showJoints ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </>
                )}

                {/* ════════════════════════════════════
                    CREATURE TAB
                   ════════════════════════════════════ */}
                {tab === 'creatures' && (
                    <>
                        <div style={styles.subTabBar}>
                            {([['quadruped', '🐾'], ['bird', '🐦'], ['fish', '🐟'], ['insect', '🦋']] as [CreatureSubTab, string][]).map(([st, icon]) => (
                                <button key={st} onClick={() => { setCreatureSub(st); const p = (st === 'quadruped' ? QUADRUPED_PRESETS : st === 'bird' ? BIRD_PRESETS : st === 'fish' ? FISH_PRESETS : INSECT_PRESETS)[0]; setCreatureConfig(p.config); setSelectedCreaturePreset(p.id) }}
                                    style={{ ...styles.subTab, ...(creatureSub === st ? styles.subTabActive : {}) }}>
                                    {icon} {st.charAt(0).toUpperCase() + st.slice(1)}
                                </button>
                            ))}
                        </div>

                        <SectionHeader title="Species Presets" />
                        <div style={styles.presetGrid}>
                            {(creatureSub === 'quadruped' ? QUADRUPED_PRESETS : creatureSub === 'bird' ? BIRD_PRESETS : creatureSub === 'fish' ? FISH_PRESETS : INSECT_PRESETS).map(p => (
                                <PresetCard key={p.id} preset={p} selected={selectedCreaturePreset === p.id}
                                    onClick={() => { setCreatureConfig(p.config); setSelectedCreaturePreset(p.id) }} />
                            ))}
                        </div>

                        <SectionHeader title="Parameters" />
                        {creatureSub === 'quadruped' && creatureConfig.family === 'quadruped' && (
                            <>
                                <Slider label="Body Length" value={creatureConfig.bodyLength} min={0.2} max={5} step={0.1} onChange={v => setCreatureConfig(c => ({ ...c as QuadrupedConfig, bodyLength: v }))} suffix="m" />
                                <Slider label="Height" value={creatureConfig.height} min={0.1} max={4} step={0.1} onChange={v => setCreatureConfig(c => ({ ...c as QuadrupedConfig, height: v }))} suffix="m" />
                                <Slider label="Bulk" value={creatureConfig.bulk} onChange={v => setCreatureConfig(c => ({ ...c as QuadrupedConfig, bulk: v }))} />
                                <Slider label="Head Size" value={creatureConfig.headSize} onChange={v => setCreatureConfig(c => ({ ...c as QuadrupedConfig, headSize: v }))} />
                                <Slider label="Neck Length" value={creatureConfig.neckLength} onChange={v => setCreatureConfig(c => ({ ...c as QuadrupedConfig, neckLength: v }))} />
                                <Slider label="Snout" value={creatureConfig.snoutLength} onChange={v => setCreatureConfig(c => ({ ...c as QuadrupedConfig, snoutLength: v }))} />
                                <Slider label="Tail Length" value={creatureConfig.tailLength} onChange={v => setCreatureConfig(c => ({ ...c as QuadrupedConfig, tailLength: v }))} />
                                <Slider label="Tail Bushiness" value={creatureConfig.tailBushiness} onChange={v => setCreatureConfig(c => ({ ...c as QuadrupedConfig, tailBushiness: v }))} />
                                <Slider label="Fur Roughness" value={creatureConfig.furRoughness} onChange={v => setCreatureConfig(c => ({ ...c as QuadrupedConfig, furRoughness: v }))} />
                                <ColorPicker label="Body Color" value={creatureConfig.bodyColor} onChange={v => setCreatureConfig(c => ({ ...c as QuadrupedConfig, bodyColor: v }))} />
                                <ColorPicker label="Secondary" value={creatureConfig.secondaryColor} onChange={v => setCreatureConfig(c => ({ ...c as QuadrupedConfig, secondaryColor: v }))} />
                            </>
                        )}
                        {creatureSub === 'bird' && creatureConfig.family === 'bird' && (
                            <>
                                <Slider label="Body Size" value={creatureConfig.bodySize} min={0.05} max={2} step={0.05} onChange={v => setCreatureConfig(c => ({ ...c as BirdConfig, bodySize: v }))} suffix="m" />
                                <Slider label="Wing Span" value={creatureConfig.wingSpan} min={0.1} max={3} step={0.1} onChange={v => setCreatureConfig(c => ({ ...c as BirdConfig, wingSpan: v }))} />
                                <Slider label="Beak Length" value={creatureConfig.beakLength} onChange={v => setCreatureConfig(c => ({ ...c as BirdConfig, beakLength: v }))} />
                                <Slider label="Beak Curve" value={creatureConfig.beakCurve} onChange={v => setCreatureConfig(c => ({ ...c as BirdConfig, beakCurve: v }))} />
                                <ColorPicker label="Body Color" value={creatureConfig.bodyColor} onChange={v => setCreatureConfig(c => ({ ...c as BirdConfig, bodyColor: v }))} />
                            </>
                        )}
                        {creatureSub === 'fish' && creatureConfig.family === 'fish' && (
                            <>
                                <Slider label="Body Length" value={creatureConfig.bodyLength} min={0.05} max={5} step={0.05} onChange={v => setCreatureConfig(c => ({ ...c as FishConfig, bodyLength: v }))} suffix="m" />
                                <Slider label="Body Depth" value={creatureConfig.bodyDepth} min={0.02} max={1} step={0.02} onChange={v => setCreatureConfig(c => ({ ...c as FishConfig, bodyDepth: v }))} />
                                <Slider label="Dorsal Fin" value={creatureConfig.dorsalHeight} min={0} max={0.5} step={0.02} onChange={v => setCreatureConfig(c => ({ ...c as FishConfig, dorsalHeight: v }))} />
                                <Slider label="Tail Fork" value={creatureConfig.tailFork} onChange={v => setCreatureConfig(c => ({ ...c as FishConfig, tailFork: v }))} />
                                <ColorPicker label="Body Color" value={creatureConfig.bodyColor} onChange={v => setCreatureConfig(c => ({ ...c as FishConfig, bodyColor: v }))} />
                            </>
                        )}
                    </>
                )}

                {/* ════════════════════════════════════
                    NATURE TAB
                   ════════════════════════════════════ */}
                {tab === 'nature' && (
                    <>
                        <div style={styles.subTabBar}>
                            {([['tree', '🌳'], ['flower', '🌸'], ['plant', '🌿'], ['rock', '🪨']] as [NatureSubTab, string][]).map(([st, icon]) => (
                                <button key={st} onClick={() => { setNatureSub(st); const p = (st === 'tree' ? TREE_PRESETS : st === 'flower' ? FLOWER_PRESETS : st === 'plant' ? PLANT_PRESETS : ROCK_PRESETS)[0]; setNatureConfig(p.config); setSelectedNaturePreset(p.id) }}
                                    style={{ ...styles.subTab, ...(natureSub === st ? styles.subTabActive : {}) }}>
                                    {icon} {st.charAt(0).toUpperCase() + st.slice(1)}
                                </button>
                            ))}
                        </div>

                        <SectionHeader title="Presets" />
                        <div style={styles.presetGrid}>
                            {(natureSub === 'tree' ? TREE_PRESETS : natureSub === 'flower' ? FLOWER_PRESETS : natureSub === 'plant' ? PLANT_PRESETS : ROCK_PRESETS).map(p => (
                                <PresetCard key={p.id} preset={p} selected={selectedNaturePreset === p.id}
                                    onClick={() => { setNatureConfig(p.config); setSelectedNaturePreset(p.id) }} />
                            ))}
                        </div>

                        <SectionHeader title="Parameters" />
                        {natureSub === 'tree' && natureConfig.type === 'tree' && (
                            <>
                                <Slider label="Height" value={natureConfig.height} min={1} max={15} step={0.5} onChange={v => setNatureConfig(c => ({ ...c as TreeConfig, height: v }))} suffix="m" />
                                <Slider label="Trunk Width" value={natureConfig.trunkDiameter} min={0.05} max={1} step={0.05} onChange={v => setNatureConfig(c => ({ ...c as TreeConfig, trunkDiameter: v }))} />
                                <Slider label="Branch Levels" value={natureConfig.branchLevels} min={1} max={6} step={1} onChange={v => setNatureConfig(c => ({ ...c as TreeConfig, branchLevels: v }))} />
                                <Slider label="Canopy Density" value={natureConfig.canopyDensity} onChange={v => setNatureConfig(c => ({ ...c as TreeConfig, canopyDensity: v }))} />
                                <Slider label="Leaf Size" value={natureConfig.leafSize} min={0.1} max={1} step={0.05} onChange={v => setNatureConfig(c => ({ ...c as TreeConfig, leafSize: v }))} />
                                <ColorPicker label="Trunk" value={natureConfig.trunkColor} onChange={v => setNatureConfig(c => ({ ...c as TreeConfig, trunkColor: v }))} />
                                <ColorPicker label="Leaves" value={natureConfig.leafColor} onChange={v => setNatureConfig(c => ({ ...c as TreeConfig, leafColor: v }))} />
                            </>
                        )}
                        {natureSub === 'flower' && natureConfig.type === 'flower' && (
                            <>
                                <Slider label="Stem Height" value={natureConfig.stemHeight} min={0.1} max={1} step={0.05} onChange={v => setNatureConfig(c => ({ ...c as FlowerConfig, stemHeight: v }))} suffix="m" />
                                <Slider label="Petal Count" value={natureConfig.petalCount} min={3} max={40} step={1} onChange={v => setNatureConfig(c => ({ ...c as FlowerConfig, petalCount: v }))} />
                                <Slider label="Petal Size" value={natureConfig.petalSize} min={0.01} max={0.15} step={0.005} onChange={v => setNatureConfig(c => ({ ...c as FlowerConfig, petalSize: v }))} />
                                <Slider label="Curl" value={natureConfig.petalCurl} onChange={v => setNatureConfig(c => ({ ...c as FlowerConfig, petalCurl: v }))} />
                                <ColorPicker label="Petals" value={natureConfig.petalColor} onChange={v => setNatureConfig(c => ({ ...c as FlowerConfig, petalColor: v }))} />
                                <ColorPicker label="Center" value={natureConfig.centerColor} onChange={v => setNatureConfig(c => ({ ...c as FlowerConfig, centerColor: v }))} />
                            </>
                        )}
                        {natureSub === 'rock' && natureConfig.type === 'rock' && (
                            <>
                                <Slider label="Size" value={natureConfig.size} min={0.02} max={5} step={0.1} onChange={v => setNatureConfig(c => ({ ...c as RockConfig, size: v }))} suffix="m" />
                                <Slider label="Roughness" value={natureConfig.roughness} onChange={v => setNatureConfig(c => ({ ...c as RockConfig, roughness: v }))} />
                                <Slider label="Jaggedness" value={natureConfig.jaggedness} onChange={v => setNatureConfig(c => ({ ...c as RockConfig, jaggedness: v }))} />
                                <ColorPicker label="Color" value={natureConfig.color} onChange={v => setNatureConfig(c => ({ ...c as RockConfig, color: v }))} />
                            </>
                        )}
                    </>
                )}
            </div>

            {/* ── Action Buttons ── */}
            <div style={styles.actions}>
                <button onClick={handleRandomize} style={styles.randomBtn}>
                    🎲 Randomize
                </button>
                <button onClick={handleGenerate} style={styles.generateBtn}>
                    <span style={styles.generateGlow} />
                    ⚡ Generate & Add to Scene
                </button>
            </div>
        </div>
    )
}

export default GeneratorPanel

// ══════════════════════════════════════════
//  STYLES — Ultra-premium Trust Layer dark glassmorphism
// ══════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
    panel: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, rgba(6,8,15,0.98) 0%, rgba(8,12,22,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        color: '#e2e8f0',
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: '12px',
        borderLeft: '1px solid rgba(6, 182, 212, 0.15)',
        position: 'relative',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '16px 16px 12px',
        borderBottom: '1px solid rgba(6, 182, 212, 0.1)',
        position: 'relative',
    },
    orb: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, #06b6d4, #0891b2)',
        boxShadow: '0 0 12px rgba(6, 182, 212, 0.6), 0 0 4px rgba(6, 182, 212, 0.8)',
        animation: 'pulse 2s ease-in-out infinite',
    },
    title: {
        fontSize: '14px',
        fontWeight: 700,
        letterSpacing: '0.05em',
        color: '#f1f5f9',
        margin: 0,
        flex: 1,
    },
    badge: {
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: '#06b6d4',
        background: 'rgba(6, 182, 212, 0.12)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '4px',
        padding: '2px 6px',
    },
    tabBar: {
        display: 'flex',
        gap: '2px',
        padding: '8px 12px',
        borderBottom: '1px solid rgba(6, 182, 212, 0.08)',
    },
    tab: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flex: 1,
        padding: '8px 4px',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        color: '#64748b',
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'all 0.2s ease',
        justifyContent: 'center',
    },
    tabActive: {
        background: 'rgba(6, 182, 212, 0.1)',
        borderColor: 'rgba(6, 182, 212, 0.3)',
        color: '#06b6d4',
        boxShadow: '0 0 15px rgba(6, 182, 212, 0.08)',
    },
    tabLabel: {
        fontSize: '11px',
        fontWeight: 600,
    },
    subTabBar: {
        display: 'flex',
        gap: '4px',
        marginBottom: '12px',
    },
    subTab: {
        flex: 1,
        padding: '6px 4px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '6px',
        color: '#64748b',
        cursor: 'pointer',
        fontSize: '10px',
        transition: 'all 0.2s ease',
    },
    subTabActive: {
        background: 'rgba(6, 182, 212, 0.08)',
        borderColor: 'rgba(6, 182, 212, 0.2)',
        color: '#22d3ee',
    },
    content: {
        flex: 1,
        overflowY: 'auto',
        padding: '12px 14px',
        scrollbarWidth: 'thin' as any,
        scrollbarColor: 'rgba(6,182,212,0.2) transparent',
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '14px 0 8px',
    },
    sectionDot: {
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: '#06b6d4',
        boxShadow: '0 0 6px rgba(6, 182, 212, 0.5)',
    },
    sectionTitle: {
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as any,
        color: '#94a3b8',
    },
    presetGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        marginBottom: '8px',
    },
    presetCard: {
        display: 'flex',
        flexDirection: 'column' as any,
        alignItems: 'center',
        gap: '4px',
        padding: '8px 4px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: '#94a3b8',
        fontSize: '10px',
    },
    presetCardActive: {
        background: 'rgba(6, 182, 212, 0.12)',
        borderColor: 'rgba(6, 182, 212, 0.4)',
        color: '#06b6d4',
        boxShadow: '0 0 12px rgba(6, 182, 212, 0.1)',
    },
    presetIcon: {
        fontSize: '18px',
    },
    presetName: {
        fontSize: '9px',
        fontWeight: 600,
        textAlign: 'center' as any,
        lineHeight: '1.2',
    },
    presetImageWrap: {
        position: 'relative' as any,
        width: '100%',
        aspectRatio: '1',
        overflow: 'hidden',
        borderRadius: '6px 6px 0 0',
    },
    presetImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as any,
        transition: 'transform 0.3s ease',
    },
    presetImageOverlay: {
        position: 'absolute' as any,
        inset: 0,
        background: 'linear-gradient(to top, rgba(6,8,15,0.8) 0%, transparent 60%)',
        pointerEvents: 'none' as any,
    },
    sliderRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '6px',
    },
    sliderLabel: {
        width: '80px',
        fontSize: '11px',
        color: '#94a3b8',
        flexShrink: 0,
    },
    slider: {
        flex: 1,
        height: '3px',
        accentColor: '#06b6d4',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '2px',
        appearance: 'auto' as any,
        cursor: 'pointer',
    },
    sliderValue: {
        width: '45px',
        fontSize: '10px',
        color: '#64748b',
        textAlign: 'right' as any,
        fontFamily: "'JetBrains Mono', monospace",
    },
    colorInput: {
        width: '24px',
        height: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px',
        padding: 0,
        cursor: 'pointer',
        background: 'transparent',
    },
    select: {
        flex: 1,
        padding: '5px 8px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px',
        color: '#e2e8f0',
        fontSize: '11px',
        cursor: 'pointer',
        appearance: 'auto' as any,
    },
    toggleRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
    },
    toggleBtn: {
        padding: '4px 14px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.03)',
        color: '#64748b',
        fontSize: '10px',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    toggleOn: {
        background: 'rgba(6, 182, 212, 0.15)',
        borderColor: 'rgba(6, 182, 212, 0.4)',
        color: '#06b6d4',
        boxShadow: '0 0 10px rgba(6, 182, 212, 0.15)',
    },
    actions: {
        display: 'flex',
        gap: '8px',
        padding: '12px 14px',
        borderTop: '1px solid rgba(6, 182, 212, 0.1)',
    },
    randomBtn: {
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: '#94a3b8',
        fontSize: '11px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    generateBtn: {
        flex: 1,
        padding: '10px 18px',
        background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(14,165,233,0.15) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.4)',
        borderRadius: '10px',
        color: '#06b6d4',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        position: 'relative' as any,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: '0 0 20px rgba(6, 182, 212, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
    },
    generateGlow: {
        position: 'absolute' as any,
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
        animation: 'spin 4s linear infinite',
        pointerEvents: 'none' as any,
    },
}
