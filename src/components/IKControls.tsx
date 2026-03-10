/* ====== TrustGen — IK Controls Panel ======
 * UI for enabling/disabling IK chains and adjusting targets.
 */
import { useState } from 'react'
import {
    HUMANOID_IK_CHAINS,
    type IKSolverConfig,
    DEFAULT_IK_CONFIG,
} from '../engine/InverseKinematics'
import './IKControls.css'

interface IKControlsProps {
    /** Currently active IK chains by name */
    activeChains: Set<string>
    /** Toggle a chain on/off */
    onToggleChain: (chainName: string) => void
    /** Update IK weight for a chain */
    onSetWeight?: (chainName: string, weight: number) => void
    /** Weight values per chain */
    weights?: Record<string, number>
    /** Solver config */
    config?: IKSolverConfig
    /** Update solver config */
    onConfigChange?: (config: Partial<IKSolverConfig>) => void
    /** Whether any model with a rig is selected */
    hasRig: boolean
}

export default function IKControls({
    activeChains,
    onToggleChain,
    onSetWeight,
    weights = {},
    config = DEFAULT_IK_CONFIG,
    onConfigChange,
    hasRig,
}: IKControlsProps) {
    const [showAdvanced, setShowAdvanced] = useState(false)

    if (!hasRig) {
        return (
            <div className="ik-empty">
                <div className="ik-empty-icon">🦴</div>
                <div className="ik-empty-text">
                    Select a rigged model to use IK
                </div>
                <div className="ik-empty-hint">
                    Import a model and apply a rig using Auto-Rigging first
                </div>
            </div>
        )
    }

    return (
        <div className="ik-controls">
            <div className="ik-header">
                <span className="ik-badge">
                    {activeChains.size}/{HUMANOID_IK_CHAINS.length} active
                </span>
            </div>

            {/* Chain Toggles */}
            <div className="ik-chains">
                {HUMANOID_IK_CHAINS.map(chain => {
                    const isActive = activeChains.has(chain.label)
                    const weight = weights[chain.label] ?? 1
                    return (
                        <div
                            key={chain.name}
                            className={`ik-chain-row ${isActive ? 'active' : ''}`}
                        >
                            <button
                                className="ik-chain-toggle"
                                onClick={() => onToggleChain(chain.label)}
                            >
                                <span className="ik-chain-icon">{chain.icon}</span>
                                <span className="ik-chain-name">{chain.label}</span>
                                <span className={`ik-chain-status ${isActive ? 'on' : 'off'}`}>
                                    {isActive ? 'IK' : 'FK'}
                                </span>
                            </button>

                            {isActive && onSetWeight && (
                                <div className="ik-weight-row">
                                    <label className="ik-weight-label">Blend</label>
                                    <input
                                        type="range"
                                        className="ik-weight-slider"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={weight}
                                        onChange={e =>
                                            onSetWeight(chain.label, parseFloat(e.target.value))
                                        }
                                    />
                                    <span className="ik-weight-value">
                                        {(weight * 100).toFixed(0)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Description */}
            <div className="ik-tip">
                💡 Enable a chain, then drag the IK handle in the viewport
                to pose the limb interactively.
            </div>

            {/* Advanced Settings */}
            <button
                className="ik-advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
            >
                ⚙️ Solver Settings {showAdvanced ? '▴' : '▾'}
            </button>

            {showAdvanced && onConfigChange && (
                <div className="ik-advanced">
                    <div className="ik-setting">
                        <label>Iterations</label>
                        <input
                            type="number"
                            min={1}
                            max={50}
                            value={config.iterations}
                            onChange={e =>
                                onConfigChange({ iterations: parseInt(e.target.value) || 10 })
                            }
                        />
                    </div>
                    <div className="ik-setting">
                        <label>Tolerance</label>
                        <input
                            type="number"
                            min={0.0001}
                            max={0.1}
                            step={0.001}
                            value={config.tolerance}
                            onChange={e =>
                                onConfigChange({ tolerance: parseFloat(e.target.value) || 0.001 })
                            }
                        />
                    </div>
                    <div className="ik-setting">
                        <label>Damping</label>
                        <input
                            type="range"
                            min={0.1}
                            max={1}
                            step={0.05}
                            value={config.damping}
                            onChange={e =>
                                onConfigChange({ damping: parseFloat(e.target.value) })
                            }
                        />
                        <span>{config.damping.toFixed(2)}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
