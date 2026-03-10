/* ====== Prop Recipes — Medieval Environment (26 assets) ====== */
import type { PropRecipe } from './propTypes'

export const MEDIEVAL_ENV_RECIPES: PropRecipe[] = [
    // ── Buildings ──
    {
        id: 'env-med-keep', name: 'Castle Keep', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Main Tower', primitive: 'box', position: [0, 4, 0], scale: [6, 8, 6], material: 'concrete', color: '#777777' },
            { label: 'Parapet', primitive: 'box', position: [0, 8.5, 0], scale: [7, 1, 7], material: 'concrete', color: '#888888' },
            { label: 'Corner Tower', primitive: 'cylinder', position: [3.5, 5, 3.5], scale: [1.5, 10, 1.5], material: 'concrete', color: '#777777' },
            { label: 'Tower Roof', primitive: 'cone', position: [3.5, 11, 3.5], scale: [2, 3, 2], material: 'concrete', color: '#444455' },
            { label: 'Door', primitive: 'box', position: [0, 1, 3.1], scale: [1.5, 2, 0.2], material: 'wood', color: '#5a3d1a' },
        ],
    },
    {
        id: 'env-med-guardtower', name: 'Castle Guard Tower', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Tower Body', primitive: 'cylinder', position: [0, 5, 0], scale: [2.5, 10, 2.5], material: 'concrete', color: '#777777' },
            { label: 'Roof', primitive: 'cone', position: [0, 11, 0], scale: [3, 3, 3], material: 'concrete', color: '#444455' },
            { label: 'Balcony Ring', primitive: 'torus', position: [0, 8, 0], scale: [3, 3, 0.3], rotation: [90, 0, 0], material: 'concrete', color: '#888888' },
        ],
    },
    {
        id: 'env-med-cottage', name: 'Thatched Cottage', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Walls', primitive: 'box', position: [0, 1.5, 0], scale: [4, 3, 3.5], material: 'default', color: '#e8dcc8' },
            { label: 'Timber Frame 1', primitive: 'box', position: [0, 1.5, 1.76], scale: [4, 0.15, 0.1], material: 'wood', color: '#3a2510' },
            { label: 'Timber Frame 2', primitive: 'box', position: [2, 1.5, 0], scale: [0.1, 3, 3.5], material: 'wood', color: '#3a2510' },
            { label: 'Roof', primitive: 'cone', position: [0, 4, 0], scale: [5, 2.5, 4.5], material: 'default', color: '#b8952e' },
            { label: 'Chimney', primitive: 'box', position: [1.5, 5, 0], scale: [0.6, 2, 0.6], material: 'concrete', color: '#666666' },
            { label: 'Door', primitive: 'box', position: [0, 0.8, 1.8], scale: [0.8, 1.6, 0.1], material: 'wood', color: '#4a3015' },
        ],
    },
    {
        id: 'env-med-tavern', name: 'Medieval Tavern', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Ground Floor', primitive: 'box', position: [0, 1.5, 0], scale: [6, 3, 5], material: 'default', color: '#e0d0b8' },
            { label: 'Upper Floor', primitive: 'box', position: [0, 4, 0], scale: [7, 3, 5.5], material: 'default', color: '#e0d0b8' },
            { label: 'Timber H1', primitive: 'box', position: [3, 2.5, 2.51], scale: [0.12, 5, 0.1], material: 'wood', color: '#2a1808' },
            { label: 'Timber H2', primitive: 'box', position: [-3, 2.5, 2.51], scale: [0.12, 5, 0.1], material: 'wood', color: '#2a1808' },
            { label: 'Roof', primitive: 'cone', position: [0, 6.5, 0], scale: [8, 3, 6], material: 'default', color: '#b89030' },
            { label: 'Door', primitive: 'box', position: [0, 0.9, 2.55], scale: [1.2, 1.8, 0.1], material: 'wood', color: '#4a3015' },
            { label: 'Sign Post', primitive: 'cylinder', position: [3.5, 3.5, 2.5], scale: [0.08, 2, 0.08], material: 'wood', color: '#3a2010' },
            { label: 'Sign Board', primitive: 'box', position: [3.5, 4.2, 3], scale: [0.6, 0.4, 0.05], material: 'wood', color: '#5a4020' },
        ],
    },
    {
        id: 'env-med-forge', name: 'Blacksmith Forge', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Base', primitive: 'box', position: [0, 0.5, 0], scale: [5, 1, 4], material: 'concrete', color: '#666666' },
            { label: 'Forge', primitive: 'box', position: [-1.5, 1.5, -1], scale: [2, 2, 2], material: 'concrete', color: '#8a4a2a' },
            { label: 'Chimney', primitive: 'box', position: [-1.5, 3.5, -1], scale: [1, 3, 1], material: 'concrete', color: '#777777' },
            { label: 'Roof Post 1', primitive: 'cylinder', position: [2, 2, 1.5], scale: [0.15, 4, 0.15], material: 'wood', color: '#4a3015' },
            { label: 'Roof Post 2', primitive: 'cylinder', position: [-2, 2, 1.5], scale: [0.15, 4, 0.15], material: 'wood', color: '#4a3015' },
            { label: 'Roof', primitive: 'box', position: [0, 4, 0], scale: [6, 0.15, 5], material: 'wood', color: '#5a4020' },
            { label: 'Anvil Base', primitive: 'cylinder', position: [1, 0.4, 0], scale: [0.4, 0.8, 0.4], material: 'wood', color: '#3a2510' },
            { label: 'Anvil', primitive: 'box', position: [1, 1, 0], scale: [0.5, 0.25, 0.3], material: 'chrome', color: '#555555' },
        ],
    },
    {
        id: 'env-med-chapel', name: 'Stone Chapel', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Nave', primitive: 'box', position: [0, 2.5, 0], scale: [5, 5, 8], material: 'concrete', color: '#888888' },
            { label: 'Roof', primitive: 'cone', position: [0, 6, 0], scale: [6, 3, 9], material: 'concrete', color: '#555566' },
            { label: 'Bell Tower', primitive: 'box', position: [0, 6, -4], scale: [2, 3, 2], material: 'concrete', color: '#888888' },
            { label: 'Spire', primitive: 'cone', position: [0, 8.5, -4], scale: [1.5, 2, 1.5], material: 'concrete', color: '#555566' },
            { label: 'Door', primitive: 'box', position: [0, 1.2, 4.1], scale: [1.5, 2.4, 0.1], material: 'wood', color: '#4a3015' },
        ],
    },
    {
        id: 'env-med-market', name: 'Market Stall', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Counter', primitive: 'box', position: [0, 0.9, 0], scale: [3, 0.1, 1.2], material: 'wood', color: '#6a4a25' },
            { label: 'Leg 1', primitive: 'cylinder', position: [1.3, 0.45, 0.5], scale: [0.08, 0.9, 0.08], material: 'wood', color: '#5a3a18' },
            { label: 'Leg 2', primitive: 'cylinder', position: [-1.3, 0.45, 0.5], scale: [0.08, 0.9, 0.08], material: 'wood', color: '#5a3a18' },
            { label: 'Leg 3', primitive: 'cylinder', position: [1.3, 0.45, -0.5], scale: [0.08, 0.9, 0.08], material: 'wood', color: '#5a3a18' },
            { label: 'Leg 4', primitive: 'cylinder', position: [-1.3, 0.45, -0.5], scale: [0.08, 0.9, 0.08], material: 'wood', color: '#5a3a18' },
            { label: 'Awning Post L', primitive: 'cylinder', position: [-1.5, 1.5, 0.6], scale: [0.06, 3, 0.06], material: 'wood', color: '#5a3a18' },
            { label: 'Awning Post R', primitive: 'cylinder', position: [1.5, 1.5, 0.6], scale: [0.06, 3, 0.06], material: 'wood', color: '#5a3a18' },
            { label: 'Awning', primitive: 'box', position: [0, 2.8, 0.3], scale: [3.5, 0.05, 2], rotation: [15, 0, 0], material: 'fabric', color: '#aa3333' },
        ],
    },
    {
        id: 'env-med-wall', name: 'Castle Wall Section', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Wall', primitive: 'box', position: [0, 1.5, 0], scale: [8, 3, 1.5], material: 'concrete', color: '#777777' },
            { label: 'Walkway', primitive: 'box', position: [0, 3.1, 0], scale: [8, 0.2, 2], material: 'concrete', color: '#888888' },
            { label: 'Merlon 1', primitive: 'box', position: [-3, 3.7, 0], scale: [0.8, 1, 0.5], material: 'concrete', color: '#777777' },
            { label: 'Merlon 2', primitive: 'box', position: [-1, 3.7, 0], scale: [0.8, 1, 0.5], material: 'concrete', color: '#777777' },
            { label: 'Merlon 3', primitive: 'box', position: [1, 3.7, 0], scale: [0.8, 1, 0.5], material: 'concrete', color: '#777777' },
            { label: 'Merlon 4', primitive: 'box', position: [3, 3.7, 0], scale: [0.8, 1, 0.5], material: 'concrete', color: '#777777' },
        ],
    },
    // ── Props ──
    {
        id: 'env-med-barrel', name: 'Wooden Barrel', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'cylinder', position: [0, 0.5, 0], scale: [0.4, 1, 0.4], material: 'wood', color: '#7a5a2a' },
            { label: 'Band Top', primitive: 'torus', position: [0, 0.85, 0], scale: [0.42, 0.42, 0.04], rotation: [90, 0, 0], material: 'chrome', color: '#444444' },
            { label: 'Band Bot', primitive: 'torus', position: [0, 0.15, 0], scale: [0.42, 0.42, 0.04], rotation: [90, 0, 0], material: 'chrome', color: '#444444' },
        ],
    },
    {
        id: 'env-med-haycart', name: 'Hay Cart', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Cart Bed', primitive: 'box', position: [0, 0.7, 0], scale: [2.5, 0.1, 1.2], material: 'wood', color: '#6a4a25' },
            { label: 'Side L', primitive: 'box', position: [0, 1, -0.6], scale: [2.5, 0.5, 0.08], material: 'wood', color: '#5a3a18' },
            { label: 'Side R', primitive: 'box', position: [0, 1, 0.6], scale: [2.5, 0.5, 0.08], material: 'wood', color: '#5a3a18' },
            { label: 'Hay', primitive: 'box', position: [0, 1.2, 0], scale: [2.2, 0.8, 1], material: 'default', color: '#c8a840' },
            { label: 'Wheel L', primitive: 'torus', position: [-0.8, 0.5, -0.8], scale: [0.5, 0.5, 0.08], material: 'wood', color: '#4a3015' },
            { label: 'Wheel R', primitive: 'torus', position: [-0.8, 0.5, 0.8], scale: [0.5, 0.5, 0.08], material: 'wood', color: '#4a3015' },
            { label: 'Tongue', primitive: 'box', position: [1.8, 0.6, 0], scale: [1, 0.06, 0.06], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-med-torch', name: 'Iron Torch (Wall Mount)', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Bracket', primitive: 'cylinder', position: [0, 0, 0], scale: [0.04, 0.4, 0.04], rotation: [0, 0, 45], material: 'chrome', color: '#333333' },
            { label: 'Head', primitive: 'cylinder', position: [0.2, 0.3, 0], scale: [0.06, 0.15, 0.06], material: 'default', color: '#664422' },
            { label: 'Flame', primitive: 'cone', position: [0.2, 0.5, 0], scale: [0.08, 0.15, 0.08], material: 'neon', color: '#ff6600' },
        ],
    },
    {
        id: 'env-med-taverntable', name: 'Tavern Table and Bench', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Table Top', primitive: 'box', position: [0, 0.75, 0], scale: [2, 0.08, 0.8], material: 'wood', color: '#5a3a18' },
            { label: 'Table Leg 1', primitive: 'box', position: [0.8, 0.37, 0.3], scale: [0.08, 0.74, 0.08], material: 'wood', color: '#4a2a10' },
            { label: 'Table Leg 2', primitive: 'box', position: [-0.8, 0.37, 0.3], scale: [0.08, 0.74, 0.08], material: 'wood', color: '#4a2a10' },
            { label: 'Table Leg 3', primitive: 'box', position: [0.8, 0.37, -0.3], scale: [0.08, 0.74, 0.08], material: 'wood', color: '#4a2a10' },
            { label: 'Table Leg 4', primitive: 'box', position: [-0.8, 0.37, -0.3], scale: [0.08, 0.74, 0.08], material: 'wood', color: '#4a2a10' },
            { label: 'Bench', primitive: 'box', position: [0, 0.35, 0.7], scale: [1.8, 0.06, 0.3], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-med-anvil', name: 'Blacksmith Anvil', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Stump', primitive: 'cylinder', position: [0, 0.3, 0], scale: [0.35, 0.6, 0.35], material: 'wood', color: '#5a3a18' },
            { label: 'Body', primitive: 'box', position: [0, 0.72, 0], scale: [0.5, 0.2, 0.25], material: 'chrome', color: '#444444' },
            { label: 'Horn', primitive: 'cone', position: [0.35, 0.72, 0], scale: [0.1, 0.3, 0.1], rotation: [0, 0, -90], material: 'chrome', color: '#555555' },
        ],
    },
    {
        id: 'env-med-well', name: 'Well', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Wall', primitive: 'cylinder', position: [0, 0.5, 0], scale: [1, 1, 1], material: 'concrete', color: '#777777' },
            { label: 'Post L', primitive: 'cylinder', position: [-0.5, 1.5, 0], scale: [0.06, 2, 0.06], material: 'wood', color: '#4a3015' },
            { label: 'Post R', primitive: 'cylinder', position: [0.5, 1.5, 0], scale: [0.06, 2, 0.06], material: 'wood', color: '#4a3015' },
            { label: 'Crossbar', primitive: 'cylinder', position: [0, 2.3, 0], scale: [0.04, 1.2, 0.04], rotation: [0, 0, 90], material: 'wood', color: '#4a3015' },
            { label: 'Roof', primitive: 'cone', position: [0, 2.8, 0], scale: [1.5, 1, 1.5], material: 'wood', color: '#5a4020' },
        ],
    },
    {
        id: 'env-med-crate', name: 'Wooden Crate', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'box', position: [0, 0.25, 0], scale: [0.5, 0.5, 0.5], material: 'wood', color: '#8a6a35' },
            { label: 'Plank', primitive: 'box', position: [0, 0.25, 0.26], scale: [0.5, 0.08, 0.02], material: 'wood', color: '#7a5a28' },
        ],
    },
    {
        id: 'env-med-stones', name: 'Standing Stones (Sacred)', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Stone 1', primitive: 'box', position: [0, 1.5, 0], scale: [0.8, 3, 0.4], rotation: [0, 0, 3], material: 'concrete', color: '#888888' },
            { label: 'Stone 2', primitive: 'box', position: [1.5, 1, 1], scale: [0.6, 2, 0.4], rotation: [2, 30, -2], material: 'concrete', color: '#777777' },
            { label: 'Stone 3', primitive: 'box', position: [-1, 0.8, 1.2], scale: [0.5, 1.6, 0.35], rotation: [-3, -20, 1], material: 'concrete', color: '#999999' },
        ],
    },
    // ── Nature ──
    {
        id: 'env-med-oak', name: 'Medieval Oak Tree', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Trunk', primitive: 'cylinder', position: [0, 2, 0], scale: [0.6, 4, 0.6], material: 'wood', color: '#3a2510' },
            { label: 'Canopy', primitive: 'sphere', position: [0, 5.5, 0], scale: [4, 3.5, 4], material: 'default', color: '#2a5a1a' },
            { label: 'Branch L', primitive: 'cylinder', position: [-1.5, 4, 0], scale: [0.15, 2.5, 0.15], rotation: [0, 0, 40], material: 'wood', color: '#3a2510' },
            { label: 'Branch R', primitive: 'cylinder', position: [1.5, 4, 0], scale: [0.15, 2, 0.15], rotation: [0, 0, -35], material: 'wood', color: '#3a2510' },
        ],
    },
    {
        id: 'env-med-pine', name: 'Pine Tree', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Trunk', primitive: 'cylinder', position: [0, 2, 0], scale: [0.3, 4, 0.3], material: 'wood', color: '#3a2510' },
            { label: 'Lower', primitive: 'cone', position: [0, 4, 0], scale: [3, 3, 3], material: 'default', color: '#1a4a12' },
            { label: 'Middle', primitive: 'cone', position: [0, 5.5, 0], scale: [2.5, 2.5, 2.5], material: 'default', color: '#1a5215' },
            { label: 'Top', primitive: 'cone', position: [0, 7, 0], scale: [1.5, 2, 1.5], material: 'default', color: '#1a5a18' },
        ],
    },
    // ── Weapons & Equipment ──
    {
        id: 'env-med-swordstone', name: 'Sword in Stone', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Boulder', primitive: 'dodecahedron', position: [0, 0.5, 0], scale: [1.2, 0.8, 1], material: 'concrete', color: '#777777' },
            { label: 'Blade', primitive: 'box', position: [0, 1.5, 0], scale: [0.06, 1.5, 0.3], material: 'chrome', color: '#aaaaaa' },
            { label: 'Guard', primitive: 'box', position: [0, 0.9, 0], scale: [0.5, 0.06, 0.06], material: 'chrome', color: '#888888' },
            { label: 'Grip', primitive: 'cylinder', position: [0, 0.7, 0], scale: [0.04, 0.3, 0.04], material: 'wood', color: '#4a2a10' },
        ],
    },
    {
        id: 'env-med-weaponrack', name: 'Shield and Spear Rack', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Frame', primitive: 'box', position: [0, 1, 0], scale: [1.5, 2, 0.15], material: 'wood', color: '#5a3a18' },
            { label: 'Cross', primitive: 'box', position: [0, 1, 0], scale: [0.1, 2, 0.15], material: 'wood', color: '#4a2a10' },
            { label: 'Shield', primitive: 'sphere', position: [-0.4, 1.2, 0.15], scale: [0.5, 0.6, 0.08], material: 'chrome', color: '#8a2222' },
            { label: 'Spear', primitive: 'cylinder', position: [0.4, 1, 0.15], scale: [0.03, 2.5, 0.03], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-med-archery', name: 'Archery Target', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Target', primitive: 'cylinder', position: [0, 1.2, 0], scale: [0.8, 0.15, 0.8], rotation: [0, 0, 0], material: 'default', color: '#cc3333' },
            { label: 'Inner Ring', primitive: 'cylinder', position: [0, 1.2, 0.08], scale: [0.5, 0.02, 0.5], material: 'default', color: '#ffffff' },
            { label: 'Bullseye', primitive: 'cylinder', position: [0, 1.2, 0.1], scale: [0.15, 0.02, 0.15], material: 'default', color: '#cc3333' },
            { label: 'Stand L', primitive: 'cylinder', position: [-0.4, 0.6, -0.2], scale: [0.04, 1.3, 0.04], rotation: [5, 0, 5], material: 'wood', color: '#5a3a18' },
            { label: 'Stand R', primitive: 'cylinder', position: [0.4, 0.6, -0.2], scale: [0.04, 1.3, 0.04], rotation: [5, 0, -5], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-med-banner', name: 'Hanging Banner', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Pole', primitive: 'cylinder', position: [0, 1, 0], scale: [0.04, 0.1, 0.04], rotation: [0, 0, 90], material: 'wood', color: '#5a3a18' },
            { label: 'Fabric', primitive: 'box', position: [0, 0, 0], scale: [0.8, 1.5, 0.02], material: 'fabric', color: '#8a1515' },
        ],
    },
    {
        id: 'env-med-chest', name: 'Treasure Chest', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Base', primitive: 'box', position: [0, 0.2, 0], scale: [0.6, 0.3, 0.35], material: 'wood', color: '#5a3a18' },
            { label: 'Lid', primitive: 'cylinder', position: [0, 0.4, 0], scale: [0.3, 0.6, 0.35], rotation: [90, 0, 0], material: 'wood', color: '#5a3a18' },
            { label: 'Band1', primitive: 'box', position: [0.2, 0.2, 0], scale: [0.02, 0.42, 0.37], material: 'gold', color: '#aa8822' },
            { label: 'Band2', primitive: 'box', position: [-0.2, 0.2, 0], scale: [0.02, 0.42, 0.37], material: 'gold', color: '#aa8822' },
            { label: 'Lock', primitive: 'box', position: [0, 0.2, 0.18], scale: [0.06, 0.08, 0.02], material: 'gold', color: '#bb9933' },
        ],
    },
    {
        id: 'env-med-scarecrow', name: 'Medieval Scarecrow', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Post', primitive: 'cylinder', position: [0, 1, 0], scale: [0.05, 2, 0.05], material: 'wood', color: '#5a3a18' },
            { label: 'Crossbeam', primitive: 'cylinder', position: [0, 1.5, 0], scale: [0.04, 1.2, 0.04], rotation: [0, 0, 90], material: 'wood', color: '#5a3a18' },
            { label: 'Head', primitive: 'sphere', position: [0, 2.1, 0], scale: [0.25, 0.3, 0.25], material: 'default', color: '#c8a860' },
            { label: 'Body', primitive: 'cone', position: [0, 1.2, 0], scale: [0.5, 1.2, 0.4], material: 'fabric', color: '#6a4a25' },
        ],
    },
    {
        id: 'env-med-wagon', name: 'Merchant Wagon', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Bed', primitive: 'box', position: [0, 0.8, 0], scale: [3, 0.1, 1.5], material: 'wood', color: '#6a4a25' },
            { label: 'Side L', primitive: 'box', position: [0, 1.2, -0.75], scale: [3, 0.7, 0.08], material: 'wood', color: '#5a3a18' },
            { label: 'Side R', primitive: 'box', position: [0, 1.2, 0.75], scale: [3, 0.7, 0.08], material: 'wood', color: '#5a3a18' },
            { label: 'Front', primitive: 'box', position: [1.5, 1.2, 0], scale: [0.08, 0.7, 1.5], material: 'wood', color: '#5a3a18' },
            { label: 'Wheel FL', primitive: 'torus', position: [1, 0.5, -1], scale: [0.5, 0.5, 0.06], material: 'wood', color: '#4a3015' },
            { label: 'Wheel FR', primitive: 'torus', position: [1, 0.5, 1], scale: [0.5, 0.5, 0.06], material: 'wood', color: '#4a3015' },
            { label: 'Wheel RL', primitive: 'torus', position: [-1, 0.5, -1], scale: [0.5, 0.5, 0.06], material: 'wood', color: '#4a3015' },
            { label: 'Wheel RR', primitive: 'torus', position: [-1, 0.5, 1], scale: [0.5, 0.5, 0.06], material: 'wood', color: '#4a3015' },
            { label: 'Canvas Hoop 1', primitive: 'torus', position: [0.5, 1.8, 0], scale: [0.8, 0.8, 0.04], rotation: [0, 90, 0], material: 'wood', color: '#5a3a18' },
            { label: 'Canvas', primitive: 'box', position: [0, 2, 0], scale: [2.5, 0.04, 1.6], rotation: [0, 0, 0], material: 'default', color: '#d8c8a0' },
        ],
    },
    {
        id: 'env-med-bridge', name: 'Stone Bridge', era: 'medieval', category: 'environment',
        nodes: [
            { label: 'Arch', primitive: 'torus', position: [0, 0, 0], scale: [2, 2, 1.5], rotation: [0, 90, 0], material: 'concrete', color: '#777777' },
            { label: 'Surface', primitive: 'box', position: [0, 1.8, 0], scale: [4, 0.3, 3], material: 'concrete', color: '#888888' },
            { label: 'Wall L', primitive: 'box', position: [0, 2.3, -1.5], scale: [4, 0.6, 0.2], material: 'concrete', color: '#777777' },
            { label: 'Wall R', primitive: 'box', position: [0, 2.3, 1.5], scale: [4, 0.6, 0.2], material: 'concrete', color: '#777777' },
        ],
    },
]
