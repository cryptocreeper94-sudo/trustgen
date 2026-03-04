/* ====== TrustGen — Scene Hierarchy Panel ====== */
import { useState } from 'react'
import { useEngineStore } from '../store'
import type { PrimitiveKind, NodeKind } from '../types'

const NODE_ICONS: Record<NodeKind, string> = {
    mesh: '🔷', light: '💡', camera: '🎥', group: '📁', particles: '✨', model: '📦'
}

const PRIMITIVE_ITEMS: { kind: PrimitiveKind; label: string; icon: string }[] = [
    { kind: 'box', label: 'Cube', icon: '⬜' },
    { kind: 'sphere', label: 'Sphere', icon: '🔵' },
    { kind: 'cylinder', label: 'Cylinder', icon: '🟡' },
    { kind: 'cone', label: 'Cone', icon: '🔺' },
    { kind: 'torus', label: 'Torus', icon: '⭕' },
    { kind: 'plane', label: 'Plane', icon: '📐' },
    { kind: 'dodecahedron', label: 'Dodeca', icon: '💠' },
]

function HierarchyItem({ nodeId, depth = 0 }: { nodeId: string; depth?: number }) {
    const node = useEngineStore(s => s.nodes[nodeId])
    const selectedId = useEngineStore(s => s.editor.selectedNodeId)
    const selectNode = useEngineStore(s => s.selectNode)
    const updateNode = useEngineStore(s => s.updateNode)
    const removeNode = useEngineStore(s => s.removeNode)
    const duplicateNode = useEngineStore(s => s.duplicateNode)

    const [contextMenu, setContextMenu] = useState(false)

    if (!node) return null
    const isSelected = selectedId === nodeId
    const hasChildren = node.childIds.length > 0

    return (
        <>
            <div
                className={`hierarchy-item ${isSelected ? 'selected' : ''}`}
                style={{ paddingLeft: 12 + depth * 16 }}
                onClick={() => selectNode(nodeId)}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu(!contextMenu) }}
            >
                {hasChildren && (
                    <span
                        className="expand-arrow"
                        onClick={(e) => { e.stopPropagation(); updateNode(nodeId, { expanded: !node.expanded }) }}
                    >
                        {node.expanded ? '▾' : '▸'}
                    </span>
                )}
                {!hasChildren && <span className="expand-spacer" />}
                <span className="node-icon">{NODE_ICONS[node.kind]}</span>
                <span className="node-name">{node.name}</span>
                <div className="hierarchy-actions">
                    <button
                        className="icon-btn-tiny"
                        title={node.visible ? 'Hide' : 'Show'}
                        onClick={(e) => { e.stopPropagation(); updateNode(nodeId, { visible: !node.visible }) }}
                    >
                        {node.visible ? '👁' : '🚫'}
                    </button>
                </div>
            </div>
            {contextMenu && (
                <div className="context-menu glass-card" style={{ marginLeft: 12 + depth * 16 }}>
                    <button onClick={() => { duplicateNode(nodeId); setContextMenu(false) }}>📋 Duplicate</button>
                    <button onClick={() => { removeNode(nodeId); setContextMenu(false) }}>🗑️ Delete</button>
                    <button onClick={() => { updateNode(nodeId, { locked: !node.locked }); setContextMenu(false) }}>
                        {node.locked ? '🔓 Unlock' : '🔒 Lock'}
                    </button>
                </div>
            )}
            {node.expanded && node.childIds.map(cid => (
                <HierarchyItem key={cid} nodeId={cid} depth={depth + 1} />
            ))}
        </>
    )
}

export function SceneHierarchy() {
    const rootNodeIds = useEngineStore(s => s.rootNodeIds)
    const addNode = useEngineStore(s => s.addNode)
    const [showAddMenu, setShowAddMenu] = useState(false)

    const handleAddPrimitive = (kind: PrimitiveKind) => {
        addNode({
            kind: 'mesh',
            name: kind.charAt(0).toUpperCase() + kind.slice(1),
            primitive: kind,
        })
        setShowAddMenu(false)
    }

    const handleAddLight = (lk: 'point' | 'spot' | 'directional') => {
        addNode({
            kind: 'light',
            name: `${lk.charAt(0).toUpperCase() + lk.slice(1)} Light`,
            light: { kind: lk, color: '#ffffff', intensity: 1, castShadow: true },
            transform: { position: { x: 0, y: 3, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        })
        setShowAddMenu(false)
    }

    const handleAddGroup = () => {
        addNode({ kind: 'group', name: 'Group' })
        setShowAddMenu(false)
    }

    return (
        <div className="scene-hierarchy">
            <div className="hierarchy-header">
                <h3>Scene Graph</h3>
                <button className="btn-add glass-btn" onClick={() => setShowAddMenu(!showAddMenu)}>
                    + Add
                </button>
            </div>

            {showAddMenu && (
                <div className="add-menu glass-card slide-down">
                    <div className="add-menu-section">
                        <div className="add-menu-label">Primitives</div>
                        <div className="add-menu-grid">
                            {PRIMITIVE_ITEMS.map(p => (
                                <button key={p.kind} className="add-menu-item glass-btn" onClick={() => handleAddPrimitive(p.kind)}>
                                    <span>{p.icon}</span>
                                    <span>{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="add-menu-section">
                        <div className="add-menu-label">Lights</div>
                        <div className="add-menu-grid">
                            <button className="add-menu-item glass-btn" onClick={() => handleAddLight('point')}>
                                <span>💡</span><span>Point</span>
                            </button>
                            <button className="add-menu-item glass-btn" onClick={() => handleAddLight('spot')}>
                                <span>🔦</span><span>Spot</span>
                            </button>
                            <button className="add-menu-item glass-btn" onClick={() => handleAddLight('directional')}>
                                <span>☀️</span><span>Directional</span>
                            </button>
                        </div>
                    </div>
                    <button className="add-menu-item glass-btn full-width" onClick={handleAddGroup}>
                        <span>📁</span><span>Group</span>
                    </button>
                </div>
            )}

            <div className="hierarchy-list">
                {rootNodeIds.length === 0 ? (
                    <div className="empty-hierarchy">
                        <div className="empty-icon">🎨</div>
                        <div className="empty-text">No objects yet</div>
                        <div className="empty-hint">Click "+ Add" to create objects</div>
                    </div>
                ) : (
                    rootNodeIds.map(id => (
                        <HierarchyItem key={id} nodeId={id} />
                    ))
                )}
            </div>
        </div>
    )
}
