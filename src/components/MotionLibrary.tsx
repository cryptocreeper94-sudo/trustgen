/* ====== TrustGen — Motion Library Panel ======
 * Browse, customize, and apply procedural animations
 * from the built-in motion library.
 */
import { useState, useCallback, useMemo } from 'react'
import {
    MOTION_PRESETS,
    type MotionPreset,
    type MotionParam,
} from '../engine/ProceduralMotionLibrary'
import './MotionLibrary.css'

interface MotionLibraryProps {
    /** Called when the user applies an animation clip */
    onApplyClip: (clipName: string, params: Record<string, number>) => void
    /** Called to preview (play once) without committing */
    onPreviewClip?: (clipName: string, params: Record<string, number>) => void
    /** Whether an animation is currently playing */
    isPlaying?: boolean
}

type CategoryFilter = 'all' | 'locomotion' | 'gesture' | 'idle' | 'action'

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
    all: '🎬 All',
    locomotion: '🚶 Locomotion',
    gesture: '👋 Gestures',
    idle: '🧘 Idle',
    action: '⚡ Actions',
}

export default function MotionLibrary({
    onApplyClip,
    onPreviewClip,
    isPlaying = false,
}: MotionLibraryProps) {
    const [category, setCategory] = useState<CategoryFilter>('all')
    const [expandedPreset, setExpandedPreset] = useState<string | null>(null)
    const [paramValues, setParamValues] = useState<Record<string, Record<string, number>>>({})

    const filteredPresets = useMemo(() => {
        if (category === 'all') return MOTION_PRESETS
        return MOTION_PRESETS.filter(p => p.category === category)
    }, [category])

    const getParamValue = useCallback(
        (presetName: string, param: MotionParam) => {
            return paramValues[presetName]?.[param.name] ?? param.default
        },
        [paramValues]
    )

    const setParam = useCallback(
        (presetName: string, paramName: string, value: number) => {
            setParamValues(prev => ({
                ...prev,
                [presetName]: {
                    ...(prev[presetName] || {}),
                    [paramName]: value,
                },
            }))
        },
        []
    )

    const getPresetParams = useCallback(
        (preset: MotionPreset): Record<string, number> => {
            const result: Record<string, number> = {}
            for (const p of preset.params) {
                result[p.name] = getParamValue(preset.name, p)
            }
            return result
        },
        [getParamValue]
    )

    const handleApply = useCallback(
        (preset: MotionPreset) => {
            onApplyClip(preset.name, getPresetParams(preset))
        },
        [onApplyClip, getPresetParams]
    )

    const handlePreview = useCallback(
        (preset: MotionPreset) => {
            onPreviewClip?.(preset.name, getPresetParams(preset))
        },
        [onPreviewClip, getPresetParams]
    )

    return (
        <div className="motion-library">
            <div className="motion-library-header">
                <h3 className="motion-library-title">
                    <span className="motion-lib-icon">🎭</span>
                    Motion Library
                </h3>
                <span className="motion-count">{filteredPresets.length} motions</span>
            </div>

            {/* Category Filter Tabs */}
            <div className="motion-categories">
                {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map(cat => (
                    <button
                        key={cat}
                        className={`motion-cat-btn ${category === cat ? 'active' : ''}`}
                        onClick={() => setCategory(cat)}
                    >
                        {CATEGORY_LABELS[cat]}
                    </button>
                ))}
            </div>

            {/* Preset Cards */}
            <div className="motion-presets">
                {filteredPresets.map(preset => {
                    const isExpanded = expandedPreset === preset.name
                    return (
                        <div
                            key={preset.name}
                            className={`motion-card ${isExpanded ? 'expanded' : ''}`}
                        >
                            {/* Card Header */}
                            <button
                                className="motion-card-header"
                                onClick={() =>
                                    setExpandedPreset(isExpanded ? null : preset.name)
                                }
                            >
                                <span className="motion-card-icon">{preset.icon}</span>
                                <div className="motion-card-info">
                                    <span className="motion-card-name">{preset.name}</span>
                                    <span className="motion-card-desc">
                                        {preset.description}
                                    </span>
                                </div>
                                <span className={`motion-card-chevron ${isExpanded ? 'open' : ''}`}>
                                    ▾
                                </span>
                            </button>

                            {/* Expanded: Parameters + Actions */}
                            {isExpanded && (
                                <div className="motion-card-body">
                                    {/* Parameter Sliders */}
                                    {preset.params.map(param => (
                                        <div key={param.name} className="motion-param">
                                            <div className="motion-param-header">
                                                <label className="motion-param-label">
                                                    {param.label}
                                                </label>
                                                <span className="motion-param-value">
                                                    {getParamValue(preset.name, param).toFixed(1)}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                className="motion-slider"
                                                min={param.min}
                                                max={param.max}
                                                step={param.step}
                                                value={getParamValue(preset.name, param)}
                                                onChange={e =>
                                                    setParam(
                                                        preset.name,
                                                        param.name,
                                                        parseFloat(e.target.value)
                                                    )
                                                }
                                            />
                                            <div className="motion-param-range">
                                                <span>{param.min}</span>
                                                <span>{param.max}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Action Buttons */}
                                    <div className="motion-actions">
                                        {onPreviewClip && (
                                            <button
                                                className="motion-btn preview"
                                                onClick={() => handlePreview(preset)}
                                                disabled={isPlaying}
                                            >
                                                ▶ Preview
                                            </button>
                                        )}
                                        <button
                                            className="motion-btn apply"
                                            onClick={() => handleApply(preset)}
                                        >
                                            ✓ Apply to Model
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {filteredPresets.length === 0 && (
                <div className="motion-empty">
                    No motions in this category yet.
                </div>
            )}
        </div>
    )
}
