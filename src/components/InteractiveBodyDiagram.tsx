/* ====== TrustGen — Interactive Body Diagram ====== */
/* Photorealistic human silhouette with clickable joint hotspots. */
/* Not a skeleton — a real person with glowing joint markers. */
import { useState, useMemo } from 'react'
import { HUMANOID_TEMPLATE } from '../types/rigTypes'

type ViewMode = 'front' | 'back'
type BodyGender = 'male' | 'female'

// Joint positions mapped to % coordinates on the body diagram image
// These are pixel-% positions for the T-pose front/back views
const JOINT_POSITIONS: Record<string, { front: { x: number; y: number }; back: { x: number; y: number }; group: string }> = {
    // Spine
    Head: { front: { x: 50, y: 6 }, back: { x: 50, y: 6 }, group: 'Spine' },
    Neck: { front: { x: 50, y: 14 }, back: { x: 50, y: 14 }, group: 'Spine' },
    UpperChest: { front: { x: 50, y: 22 }, back: { x: 50, y: 22 }, group: 'Spine' },
    Chest: { front: { x: 50, y: 28 }, back: { x: 50, y: 28 }, group: 'Spine' },
    Spine: { front: { x: 50, y: 36 }, back: { x: 50, y: 36 }, group: 'Spine' },
    Hips: { front: { x: 50, y: 44 }, back: { x: 50, y: 44 }, group: 'Spine' },
    // Left Arm
    L_Shoulder: { front: { x: 32, y: 18 }, back: { x: 68, y: 18 }, group: 'Left Arm' },
    L_UpperArm: { front: { x: 24, y: 22 }, back: { x: 76, y: 22 }, group: 'Left Arm' },
    L_Elbow: { front: { x: 16, y: 32 }, back: { x: 84, y: 32 }, group: 'Left Arm' },
    L_ForeArm: { front: { x: 12, y: 37 }, back: { x: 88, y: 37 }, group: 'Left Arm' },
    L_Wrist: { front: { x: 8, y: 44 }, back: { x: 92, y: 44 }, group: 'Left Arm' },
    // Right Arm
    R_Shoulder: { front: { x: 68, y: 18 }, back: { x: 32, y: 18 }, group: 'Right Arm' },
    R_UpperArm: { front: { x: 76, y: 22 }, back: { x: 24, y: 22 }, group: 'Right Arm' },
    R_Elbow: { front: { x: 84, y: 32 }, back: { x: 16, y: 32 }, group: 'Right Arm' },
    R_ForeArm: { front: { x: 88, y: 37 }, back: { x: 12, y: 37 }, group: 'Right Arm' },
    R_Wrist: { front: { x: 92, y: 44 }, back: { x: 8, y: 44 }, group: 'Right Arm' },
    // Left Leg
    L_Hip: { front: { x: 42, y: 47 }, back: { x: 58, y: 47 }, group: 'Left Leg' },
    L_Knee: { front: { x: 41, y: 64 }, back: { x: 59, y: 64 }, group: 'Left Leg' },
    L_Ankle: { front: { x: 40, y: 82 }, back: { x: 60, y: 82 }, group: 'Left Leg' },
    L_Toe: { front: { x: 39, y: 94 }, back: { x: 61, y: 94 }, group: 'Left Leg' },
    // Right Leg
    R_Hip: { front: { x: 58, y: 47 }, back: { x: 42, y: 47 }, group: 'Right Leg' },
    R_Knee: { front: { x: 59, y: 64 }, back: { x: 41, y: 64 }, group: 'Right Leg' },
    R_Ankle: { front: { x: 60, y: 82 }, back: { x: 40, y: 82 }, group: 'Right Leg' },
    R_Toe: { front: { x: 61, y: 94 }, back: { x: 39, y: 94 }, group: 'Right Leg' },
    // Left Hand fingers (clustered near wrist)
    L_Thumb_Meta: { front: { x: 7, y: 44 }, back: { x: 93, y: 44 }, group: 'Left Hand' },
    L_Thumb_Prox: { front: { x: 6, y: 46 }, back: { x: 94, y: 46 }, group: 'Left Hand' },
    L_Thumb_Dist: { front: { x: 5, y: 48 }, back: { x: 95, y: 48 }, group: 'Left Hand' },
    L_Index_Meta: { front: { x: 6, y: 45 }, back: { x: 94, y: 45 }, group: 'Left Hand' },
    L_Index_Prox: { front: { x: 5, y: 47 }, back: { x: 95, y: 47 }, group: 'Left Hand' },
    L_Index_Dist: { front: { x: 4, y: 49 }, back: { x: 96, y: 49 }, group: 'Left Hand' },
    L_Middle_Meta: { front: { x: 6, y: 45.5 }, back: { x: 94, y: 45.5 }, group: 'Left Hand' },
    L_Middle_Prox: { front: { x: 4.5, y: 47.5 }, back: { x: 95.5, y: 47.5 }, group: 'Left Hand' },
    L_Middle_Dist: { front: { x: 3, y: 49.5 }, back: { x: 97, y: 49.5 }, group: 'Left Hand' },
    L_Ring_Meta: { front: { x: 6.5, y: 46 }, back: { x: 93.5, y: 46 }, group: 'Left Hand' },
    L_Ring_Prox: { front: { x: 5, y: 48 }, back: { x: 95, y: 48 }, group: 'Left Hand' },
    L_Ring_Dist: { front: { x: 3.5, y: 50 }, back: { x: 96.5, y: 50 }, group: 'Left Hand' },
    L_Pinky_Meta: { front: { x: 7, y: 46.5 }, back: { x: 93, y: 46.5 }, group: 'Left Hand' },
    L_Pinky_Prox: { front: { x: 5.5, y: 48.5 }, back: { x: 94.5, y: 48.5 }, group: 'Left Hand' },
    L_Pinky_Dist: { front: { x: 4, y: 50.5 }, back: { x: 96, y: 50.5 }, group: 'Left Hand' },
    // Right Hand fingers
    R_Thumb_Meta: { front: { x: 93, y: 44 }, back: { x: 7, y: 44 }, group: 'Right Hand' },
    R_Thumb_Prox: { front: { x: 94, y: 46 }, back: { x: 6, y: 46 }, group: 'Right Hand' },
    R_Thumb_Dist: { front: { x: 95, y: 48 }, back: { x: 5, y: 48 }, group: 'Right Hand' },
    R_Index_Meta: { front: { x: 94, y: 45 }, back: { x: 6, y: 45 }, group: 'Right Hand' },
    R_Index_Prox: { front: { x: 95, y: 47 }, back: { x: 5, y: 47 }, group: 'Right Hand' },
    R_Index_Dist: { front: { x: 96, y: 49 }, back: { x: 4, y: 49 }, group: 'Right Hand' },
    R_Middle_Meta: { front: { x: 94, y: 45.5 }, back: { x: 6, y: 45.5 }, group: 'Right Hand' },
    R_Middle_Prox: { front: { x: 95.5, y: 47.5 }, back: { x: 4.5, y: 47.5 }, group: 'Right Hand' },
    R_Middle_Dist: { front: { x: 97, y: 49.5 }, back: { x: 3, y: 49.5 }, group: 'Right Hand' },
    R_Ring_Meta: { front: { x: 93.5, y: 46 }, back: { x: 6.5, y: 46 }, group: 'Right Hand' },
    R_Ring_Prox: { front: { x: 95, y: 48 }, back: { x: 5, y: 48 }, group: 'Right Hand' },
    R_Ring_Dist: { front: { x: 96.5, y: 50 }, back: { x: 3.5, y: 50 }, group: 'Right Hand' },
    R_Pinky_Meta: { front: { x: 93, y: 46.5 }, back: { x: 7, y: 46.5 }, group: 'Right Hand' },
    R_Pinky_Prox: { front: { x: 94.5, y: 48.5 }, back: { x: 5.5, y: 48.5 }, group: 'Right Hand' },
    R_Pinky_Dist: { front: { x: 96, y: 50.5 }, back: { x: 4, y: 50.5 }, group: 'Right Hand' },
}

const GROUP_COLORS: Record<string, string> = {
    'Spine': '#06b6d4',
    'Left Arm': '#14b8a6',
    'Right Arm': '#0ea5e9',
    'Left Leg': '#34d399',
    'Right Leg': '#38bdf8',
    'Left Hand': '#2dd4bf',
    'Right Hand': '#a78bfa',
}

interface Props {
    selectedJoint: string | null
    onSelectJoint: (jointName: string) => void
    mirrorMode?: boolean
}

export function InteractiveBodyDiagram({ selectedJoint, onSelectJoint, mirrorMode }: Props) {
    const [view, setView] = useState<ViewMode>('front')
    const [gender, setGender] = useState<BodyGender>('male')
    const [hoveredJoint, setHoveredJoint] = useState<string | null>(null)
    const [showFingers, setShowFingers] = useState(false)

    const joints = HUMANOID_TEMPLATE.joints
    const jointMap = useMemo(() => new Map(joints.map(j => [j.name, j])), [joints])

    const visibleJoints = useMemo(() => {
        return Object.entries(JOINT_POSITIONS).filter(([name]) => {
            if (!showFingers && JOINT_POSITIONS[name]?.group.includes('Hand')) return false
            return true
        })
    }, [showFingers])

    const selectedInfo = selectedJoint ? jointMap.get(selectedJoint) : null
    const hoveredInfo = hoveredJoint ? jointMap.get(hoveredJoint) : null
    const displayInfo = hoveredInfo || selectedInfo

    const bodyImage = gender === 'male' ? '/presets/body-male.png' : '/presets/body-female.png'

    return (
        <div className="body-diagram">
            {/* Controls Bar */}
            <div className="body-diagram-controls">
                <div className="body-diagram-toggle-group">
                    <button className={ody-diagram-toggle } onClick={() => setView('front')}>Front</button>
                    <button className={ody-diagram-toggle } onClick={() => setView('back')}>Back</button>
                </div>
                <div className="body-diagram-toggle-group">
                    <button className={ody-diagram-toggle } onClick={() => setGender('male')}>♂</button>
                    <button className={ody-diagram-toggle } onClick={() => setGender('female')}>♀</button>
                </div>
                <button className={ody-diagram-toggle } onClick={() => setShowFingers(!showFingers)} style={{ fontSize: '10px' }}>
                    🤚 Fingers
                </button>
                {mirrorMode && <span className="body-diagram-mirror-badge">⟷ Mirror</span>}
            </div>

            {/* Body Image + Joint Markers */}
            <div className="body-diagram-canvas">
                <img src={bodyImage} alt="" className="body-diagram-image" draggable={false} />

                {/* Joint markers */}
                {visibleJoints.map(([name, pos]) => {
                    const coords = view === 'front' ? pos.front : pos.back
                    const isSelected = selectedJoint === name
                    const isHovered = hoveredJoint === name
                    const isMirror = mirrorMode && selectedJoint && jointMap.get(selectedJoint)?.mirrorName === name
                    const group = pos.group
                    const color = GROUP_COLORS[group] || '#06b6d4'
                    const isFingerJoint = group.includes('Hand')
                    const size = isFingerJoint ? 6 : isSelected ? 14 : isHovered ? 12 : 8

                    return (
                        <button
                            key={name}
                            className={ody-diagram-joint   }
                            style={{
                                left: coords.x + '%',
                                top: coords.y + '%',
                                width: size + 'px',
                                height: size + 'px',
                                background: isSelected ? '#fff' : color,
                                boxShadow: isSelected
                                    ? '0 0 16px ' + color + ', 0 0 32px ' + color + '60'
                                    : isHovered
                                    ? '0 0 12px ' + color + '80'
                                    : isMirror
                                    ? '0 0 8px #a855f780'
                                    : '0 0 4px ' + color + '40',
                                borderColor: isSelected ? color : isMirror ? '#a855f7' : 'transparent',
                            }}
                            onClick={() => onSelectJoint(name)}
                            onMouseEnter={() => setHoveredJoint(name)}
                            onMouseLeave={() => setHoveredJoint(null)}
                            title={name.replace(/_/g, ' ')}
                        />
                    )
                })}

                {/* Connection lines between parent-child joints */}
                <svg className="body-diagram-bones" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {visibleJoints.map(([name, pos]) => {
                        const joint = jointMap.get(name)
                        if (!joint?.parentName || !JOINT_POSITIONS[joint.parentName]) return null
                        const parentPos = JOINT_POSITIONS[joint.parentName]
                        if (!parentPos) return null
                        const from = view === 'front' ? pos.front : pos.back
                        const to = view === 'front' ? parentPos.front : parentPos.back
                        const isActive = selectedJoint === name || selectedJoint === joint.parentName
                        const group = pos.group
                        const color = GROUP_COLORS[group] || '#06b6d4'
                        return (
                            <line key={name + '-bone'}
                                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                                stroke={isActive ? color : color + '30'}
                                strokeWidth={isActive ? 0.4 : 0.15}
                            />
                        )
                    })}
                </svg>
            </div>

            {/* Joint Info Panel */}
            {displayInfo && (
                <div className="body-diagram-info">
                    <div className="body-diagram-info-name" style={{ color: GROUP_COLORS[JOINT_POSITIONS[displayInfo.name]?.group] || '#06b6d4' }}>
                        {displayInfo.name.replace(/_/g, ' ')}
                    </div>
                    <div className="body-diagram-info-row">
                        <span>Type</span><span className="body-diagram-info-val">{displayInfo.type}</span>
                    </div>
                    <div className="body-diagram-info-row">
                        <span>Group</span><span className="body-diagram-info-val">{JOINT_POSITIONS[displayInfo.name]?.group}</span>
                    </div>
                    {displayInfo.mirrorName && (
                        <div className="body-diagram-info-row">
                            <span>Mirror</span><span className="body-diagram-info-val">{displayInfo.mirrorName.replace(/_/g, ' ')}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Joint count badge */}
            <div className="body-diagram-count">
                {joints.length} joints · {showFingers ? 'Full Rig' : 'Major Joints'}
            </div>
        </div>
    )
}
