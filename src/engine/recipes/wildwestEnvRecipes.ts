/* ====== Prop Recipes — Wild West Environment (26 assets) ====== */
import type { PropRecipe } from '../propTypes'

export const WILDWEST_ENV_RECIPES: PropRecipe[] = [
    // ── Buildings ──
    {
        id: 'env-ww-saloon', name: 'Saloon', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Ground Floor', primitive: 'box', position: [0, 2, 0], scale: [7, 4, 5], material: 'wood', color: '#8a6a3a' },
            { label: 'False Front', primitive: 'box', position: [0, 5, 2.51], scale: [7.5, 2, 0.15], material: 'wood', color: '#8a6a3a' },
            { label: 'Upper Floor', primitive: 'box', position: [0, 5, 0], scale: [7, 2, 5], material: 'wood', color: '#7a5a30' },
            { label: 'Porch Roof', primitive: 'box', position: [0, 3.8, 3], scale: [8, 0.1, 2], material: 'wood', color: '#6a4a25' },
            { label: 'Porch Post L', primitive: 'cylinder', position: [-3, 2, 3.5], scale: [0.1, 4, 0.1], material: 'wood', color: '#6a4a25' },
            { label: 'Porch Post R', primitive: 'cylinder', position: [3, 2, 3.5], scale: [0.1, 4, 0.1], material: 'wood', color: '#6a4a25' },
            { label: 'Door', primitive: 'box', position: [0, 1, 2.55], scale: [1, 2, 0.08], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-ww-sheriff', name: 'Sheriff Office & Jail', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Main', primitive: 'box', position: [0, 1.5, 0], scale: [6, 3, 5], material: 'concrete', color: '#9a8a6a' },
            { label: 'Upper Wood', primitive: 'box', position: [0, 3.2, 0], scale: [6, 0.5, 5], material: 'wood', color: '#7a5a30' },
            { label: 'Roof', primitive: 'box', position: [0, 3.6, 0], scale: [7, 0.15, 5.5], rotation: [3, 0, 0], material: 'wood', color: '#6a4a25' },
            { label: 'Porch', primitive: 'box', position: [0, 2.8, 2.8], scale: [7, 0.1, 1.5], material: 'wood', color: '#6a4a25' },
            { label: 'Jail Window', primitive: 'box', position: [2, 1.5, 2.55], scale: [0.5, 0.6, 0.05], material: 'chrome', color: '#444444' },
            { label: 'Door', primitive: 'box', position: [-1, 1, 2.55], scale: [0.9, 2, 0.08], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-ww-generalstore', name: 'General Store', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Main', primitive: 'box', position: [0, 1.5, 0], scale: [6, 3, 5], material: 'wood', color: '#9a7a4a' },
            { label: 'Porch', primitive: 'box', position: [0, 2.8, 3], scale: [7, 0.1, 2], material: 'wood', color: '#7a5a30' },
            { label: 'Porch Post L', primitive: 'cylinder', position: [-2.5, 1.5, 3.5], scale: [0.08, 3, 0.08], material: 'wood', color: '#6a4a25' },
            { label: 'Porch Post R', primitive: 'cylinder', position: [2.5, 1.5, 3.5], scale: [0.08, 3, 0.08], material: 'wood', color: '#6a4a25' },
            { label: 'Door', primitive: 'box', position: [0, 1, 2.55], scale: [1, 2, 0.08], material: 'wood', color: '#5a3a18' },
            { label: 'Window L', primitive: 'box', position: [-1.5, 1.5, 2.55], scale: [0.8, 0.8, 0.03], material: 'glass', color: '#88bbdd' },
            { label: 'Window R', primitive: 'box', position: [1.5, 1.5, 2.55], scale: [0.8, 0.8, 0.03], material: 'glass', color: '#88bbdd' },
        ],
    },
    {
        id: 'env-ww-cabin', name: 'Log Cabin Homestead', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Walls', primitive: 'box', position: [0, 1.5, 0], scale: [5, 3, 4], material: 'wood', color: '#6a4a25' },
            { label: 'Roof L', primitive: 'box', position: [0, 3.5, -1], scale: [5.5, 0.15, 2.5], rotation: [20, 0, 0], material: 'wood', color: '#5a3a18' },
            { label: 'Roof R', primitive: 'box', position: [0, 3.5, 1], scale: [5.5, 0.15, 2.5], rotation: [-20, 0, 0], material: 'wood', color: '#5a3a18' },
            { label: 'Chimney', primitive: 'box', position: [2, 3.5, 0], scale: [0.8, 3, 0.8], material: 'concrete', color: '#777777' },
            { label: 'Porch', primitive: 'box', position: [0, 2.5, 2.3], scale: [5.5, 0.08, 1.5], material: 'wood', color: '#5a3a18' },
            { label: 'Door', primitive: 'box', position: [0, 1, 2.05], scale: [0.8, 1.8, 0.08], material: 'wood', color: '#4a3015' },
        ],
    },
    {
        id: 'env-ww-mining', name: 'Mining / Assay Office', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Main', primitive: 'box', position: [0, 1.2, 0], scale: [4, 2.4, 3.5], material: 'wood', color: '#8a7040' },
            { label: 'Roof', primitive: 'box', position: [0, 2.6, 0], scale: [4.5, 0.12, 4], rotation: [5, 0, 0], material: 'wood', color: '#6a4a25' },
            { label: 'Door', primitive: 'box', position: [0, 0.9, 1.8], scale: [0.8, 1.8, 0.08], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-ww-watertower', name: 'Water Tower', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Tank', primitive: 'cylinder', position: [0, 5, 0], scale: [1.5, 2, 1.5], material: 'wood', color: '#7a5a30' },
            { label: 'Lid', primitive: 'cone', position: [0, 6.2, 0], scale: [1.6, 0.8, 1.6], material: 'wood', color: '#6a4a25' },
            { label: 'Leg 1', primitive: 'cylinder', position: [1, 2, 1], scale: [0.12, 4, 0.12], material: 'wood', color: '#5a3a18' },
            { label: 'Leg 2', primitive: 'cylinder', position: [-1, 2, 1], scale: [0.12, 4, 0.12], material: 'wood', color: '#5a3a18' },
            { label: 'Leg 3', primitive: 'cylinder', position: [1, 2, -1], scale: [0.12, 4, 0.12], material: 'wood', color: '#5a3a18' },
            { label: 'Leg 4', primitive: 'cylinder', position: [-1, 2, -1], scale: [0.12, 4, 0.12], material: 'wood', color: '#5a3a18' },
            { label: 'Brace', primitive: 'box', position: [0, 2.5, 0], scale: [2.5, 0.08, 2.5], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-ww-barn', name: 'Barn', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'box', position: [0, 2.5, 0], scale: [10, 5, 7], material: 'wood', color: '#8a2222' },
            { label: 'Loft', primitive: 'cone', position: [0, 6, 0], scale: [10.5, 3, 7.5], material: 'wood', color: '#7a1a1a' },
            { label: 'Door L', primitive: 'box', position: [-1.5, 2, 3.55], scale: [2.5, 3.5, 0.1], material: 'wood', color: '#6a1515' },
            { label: 'Door R', primitive: 'box', position: [1.5, 2, 3.55], scale: [2.5, 3.5, 0.1], material: 'wood', color: '#6a1515' },
            { label: 'Hay Door', primitive: 'box', position: [0, 5.5, 3.55], scale: [1.5, 1.2, 0.08], material: 'wood', color: '#6a1515' },
        ],
    },
    {
        id: 'env-ww-station', name: 'Railroad Station', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Platform', primitive: 'box', position: [0, 0.3, 0], scale: [8, 0.6, 3], material: 'wood', color: '#8a7040' },
            { label: 'Shelter', primitive: 'box', position: [0, 1.8, 0], scale: [4, 0.1, 3], material: 'wood', color: '#6a4a25' },
            { label: 'Post 1', primitive: 'cylinder', position: [-1.5, 1.2, 1.2], scale: [0.08, 1.8, 0.08], material: 'wood', color: '#5a3a18' },
            { label: 'Post 2', primitive: 'cylinder', position: [1.5, 1.2, 1.2], scale: [0.08, 1.8, 0.08], material: 'wood', color: '#5a3a18' },
            { label: 'Rail', primitive: 'box', position: [0, 0.05, 2.5], scale: [10, 0.05, 0.08], material: 'chrome', color: '#555555' },
        ],
    },
    // ── Props ──
    {
        id: 'env-ww-hitchpost', name: 'Hitching Post', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Post L', primitive: 'cylinder', position: [-1, 0.5, 0], scale: [0.08, 1, 0.08], material: 'wood', color: '#6a4a25' },
            { label: 'Post R', primitive: 'cylinder', position: [1, 0.5, 0], scale: [0.08, 1, 0.08], material: 'wood', color: '#6a4a25' },
            { label: 'Rail', primitive: 'cylinder', position: [0, 0.9, 0], scale: [0.05, 2, 0.05], rotation: [0, 0, 90], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-ww-wagon', name: 'Covered Wagon', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Bed', primitive: 'box', position: [0, 0.8, 0], scale: [3, 0.1, 1.5], material: 'wood', color: '#7a5a30' },
            { label: 'Side L', primitive: 'box', position: [0, 1.2, -0.75], scale: [3, 0.6, 0.08], material: 'wood', color: '#6a4a25' },
            { label: 'Side R', primitive: 'box', position: [0, 1.2, 0.75], scale: [3, 0.6, 0.08], material: 'wood', color: '#6a4a25' },
            { label: 'Canvas', primitive: 'cylinder', position: [0, 2, 0], scale: [1.2, 3, 1.2], rotation: [0, 0, 90], material: 'default', color: '#e8dcc0' },
            { label: 'Wheel FL', primitive: 'torus', position: [1, 0.5, -1], scale: [0.5, 0.5, 0.06], material: 'wood', color: '#5a3a18' },
            { label: 'Wheel FR', primitive: 'torus', position: [1, 0.5, 1], scale: [0.5, 0.5, 0.06], material: 'wood', color: '#5a3a18' },
            { label: 'Wheel RL', primitive: 'torus', position: [-1, 0.5, -1], scale: [0.6, 0.6, 0.08], material: 'wood', color: '#5a3a18' },
            { label: 'Wheel RR', primitive: 'torus', position: [-1, 0.5, 1], scale: [0.6, 0.6, 0.08], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-ww-campfire', name: 'Campfire with Cooking', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Stone 1', primitive: 'sphere', position: [0.3, 0.1, 0.3], scale: [0.2, 0.15, 0.2], material: 'concrete', color: '#555555' },
            { label: 'Stone 2', primitive: 'sphere', position: [-0.3, 0.1, 0.3], scale: [0.18, 0.13, 0.18], material: 'concrete', color: '#666666' },
            { label: 'Stone 3', primitive: 'sphere', position: [0.3, 0.1, -0.3], scale: [0.22, 0.14, 0.22], material: 'concrete', color: '#555555' },
            { label: 'Stone 4', primitive: 'sphere', position: [-0.3, 0.1, -0.3], scale: [0.2, 0.15, 0.2], material: 'concrete', color: '#666666' },
            { label: 'Log', primitive: 'cylinder', position: [0, 0.1, 0], scale: [0.08, 0.6, 0.08], rotation: [90, 30, 0], material: 'wood', color: '#3a2010' },
            { label: 'Flame', primitive: 'cone', position: [0, 0.35, 0], scale: [0.2, 0.4, 0.2], material: 'neon', color: '#ff6600' },
            { label: 'Tripod L', primitive: 'cylinder', position: [-0.15, 0.4, 0], scale: [0.02, 0.8, 0.02], rotation: [0, 0, 8], material: 'chrome', color: '#444444' },
            { label: 'Tripod R', primitive: 'cylinder', position: [0.15, 0.4, 0], scale: [0.02, 0.8, 0.02], rotation: [0, 0, -8], material: 'chrome', color: '#444444' },
            { label: 'Pot', primitive: 'sphere', position: [0, 0.55, 0], scale: [0.25, 0.2, 0.25], material: 'chrome', color: '#333333' },
        ],
    },
    {
        id: 'env-ww-whiskey', name: 'Whiskey Barrel', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'cylinder', position: [0, 0.5, 0], scale: [0.4, 1, 0.4], material: 'wood', color: '#4a2a10' },
            { label: 'Band Top', primitive: 'torus', position: [0, 0.85, 0], scale: [0.42, 0.42, 0.04], rotation: [90, 0, 0], material: 'gold', color: '#aa6622' },
            { label: 'Band Bot', primitive: 'torus', position: [0, 0.15, 0], scale: [0.42, 0.42, 0.04], rotation: [90, 0, 0], material: 'gold', color: '#aa6622' },
        ],
    },
    {
        id: 'env-ww-pokertable', name: 'Poker Table', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Top', primitive: 'cylinder', position: [0, 0.75, 0], scale: [1, 0.06, 1], material: 'default', color: '#2a6a2a' },
            { label: 'Rim', primitive: 'torus', position: [0, 0.75, 0], scale: [1, 1, 0.04], rotation: [90, 0, 0], material: 'wood', color: '#5a3a18' },
            { label: 'Leg', primitive: 'cylinder', position: [0, 0.37, 0], scale: [0.1, 0.74, 0.1], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-ww-wanted', name: 'Wanted Poster Board', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Post', primitive: 'cylinder', position: [0, 0.8, 0], scale: [0.06, 1.6, 0.06], material: 'wood', color: '#6a4a25' },
            { label: 'Board', primitive: 'box', position: [0, 1.4, 0.05], scale: [0.8, 0.6, 0.03], material: 'wood', color: '#7a5a30' },
            { label: 'Poster 1', primitive: 'box', position: [-0.2, 1.45, 0.07], scale: [0.2, 0.28, 0.01], material: 'default', color: '#e8d8b0' },
            { label: 'Poster 2', primitive: 'box', position: [0.15, 1.4, 0.07], scale: [0.2, 0.28, 0.01], material: 'default', color: '#ddd0a8' },
        ],
    },
    {
        id: 'env-ww-minecart', name: 'Mining Cart and Track', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Cart', primitive: 'box', position: [0, 0.5, 0], scale: [0.8, 0.5, 0.6], material: 'chrome', color: '#555555' },
            { label: 'Rail L', primitive: 'box', position: [0, 0.03, -0.4], scale: [2, 0.05, 0.05], material: 'chrome', color: '#666666' },
            { label: 'Rail R', primitive: 'box', position: [0, 0.03, 0.4], scale: [2, 0.05, 0.05], material: 'chrome', color: '#666666' },
            { label: 'Tie 1', primitive: 'box', position: [-0.5, 0.02, 0], scale: [0.08, 0.04, 1], material: 'wood', color: '#5a3a18' },
            { label: 'Tie 2', primitive: 'box', position: [0.5, 0.02, 0], scale: [0.08, 0.04, 1], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-ww-dynamite', name: 'Dynamite Crate', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Crate', primitive: 'box', position: [0, 0.2, 0], scale: [0.5, 0.35, 0.35], material: 'wood', color: '#8a6a35' },
            { label: 'Lid', primitive: 'box', position: [0.05, 0.4, 0], scale: [0.55, 0.04, 0.38], rotation: [0, 0, 5], material: 'wood', color: '#7a5a28' },
            { label: 'Stick 1', primitive: 'cylinder', position: [-0.1, 0.3, 0], scale: [0.03, 0.2, 0.03], rotation: [0, 0, 0], material: 'plastic', color: '#cc2222' },
            { label: 'Stick 2', primitive: 'cylinder', position: [0.05, 0.3, 0.05], scale: [0.03, 0.2, 0.03], material: 'plastic', color: '#cc2222' },
        ],
    },
    {
        id: 'env-ww-trough', name: 'Horse Trough', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'box', position: [0, 0.3, 0], scale: [2, 0.5, 0.5], material: 'wood', color: '#7a5a30' },
            { label: 'Water', primitive: 'box', position: [0, 0.45, 0], scale: [1.9, 0.05, 0.4], material: 'glass', color: '#4488aa' },
        ],
    },
    {
        id: 'env-ww-windmill', name: 'Windmill', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Leg 1', primitive: 'cylinder', position: [0.5, 2.5, 0.5], scale: [0.08, 5, 0.08], rotation: [3, 0, -3], material: 'wood', color: '#6a4a25' },
            { label: 'Leg 2', primitive: 'cylinder', position: [-0.5, 2.5, 0.5], scale: [0.08, 5, 0.08], rotation: [3, 0, 3], material: 'wood', color: '#6a4a25' },
            { label: 'Leg 3', primitive: 'cylinder', position: [0.5, 2.5, -0.5], scale: [0.08, 5, 0.08], rotation: [-3, 0, -3], material: 'wood', color: '#6a4a25' },
            { label: 'Leg 4', primitive: 'cylinder', position: [-0.5, 2.5, -0.5], scale: [0.08, 5, 0.08], rotation: [-3, 0, 3], material: 'wood', color: '#6a4a25' },
            { label: 'Hub', primitive: 'sphere', position: [0, 5.2, 0], scale: [0.3, 0.3, 0.3], material: 'chrome', color: '#666666' },
            { label: 'Blade 1', primitive: 'box', position: [0, 6.2, 0.1], scale: [0.15, 2, 0.02], material: 'chrome', color: '#888888' },
            { label: 'Blade 2', primitive: 'box', position: [1, 5.2, 0.1], scale: [2, 0.15, 0.02], material: 'chrome', color: '#888888' },
            { label: 'Blade 3', primitive: 'box', position: [0, 4.2, 0.1], scale: [0.15, 2, 0.02], material: 'chrome', color: '#888888' },
            { label: 'Blade 4', primitive: 'box', position: [-1, 5.2, 0.1], scale: [2, 0.15, 0.02], material: 'chrome', color: '#888888' },
        ],
    },
    // ── Nature ──
    {
        id: 'env-ww-saguaro', name: 'Saguaro Cactus', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Trunk', primitive: 'cylinder', position: [0, 2, 0], scale: [0.4, 4, 0.4], material: 'default', color: '#3a7a2a' },
            { label: 'Arm L', primitive: 'cylinder', position: [-0.5, 2.5, 0], scale: [0.25, 1.5, 0.25], rotation: [0, 0, 30], material: 'default', color: '#3a7a2a' },
            { label: 'Arm R', primitive: 'cylinder', position: [0.5, 3, 0], scale: [0.25, 1.2, 0.25], rotation: [0, 0, -35], material: 'default', color: '#3a7a2a' },
        ],
    },
    {
        id: 'env-ww-barrel-cactus', name: 'Barrel Cactus', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'sphere', position: [0, 0.25, 0], scale: [0.4, 0.5, 0.4], material: 'default', color: '#3a7a2a' },
            { label: 'Flower', primitive: 'torus', position: [0, 0.5, 0], scale: [0.1, 0.1, 0.03], rotation: [90, 0, 0], material: 'neon', color: '#ff6622' },
        ],
    },
    {
        id: 'env-ww-tumbleweed', name: 'Tumbleweed', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'dodecahedron', position: [0, 0.25, 0], scale: [0.5, 0.5, 0.5], material: 'default', color: '#8a6a30' },
        ],
    },
    {
        id: 'env-ww-joshua', name: 'Joshua Tree', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Trunk', primitive: 'cylinder', position: [0, 1.5, 0], scale: [0.3, 3, 0.3], material: 'wood', color: '#5a4a25' },
            { label: 'Branch L', primitive: 'cylinder', position: [-0.6, 3, 0], scale: [0.15, 1.5, 0.15], rotation: [0, 0, 35], material: 'wood', color: '#5a4a25' },
            { label: 'Branch R', primitive: 'cylinder', position: [0.5, 3.2, 0], scale: [0.15, 1.2, 0.15], rotation: [0, 0, -30], material: 'wood', color: '#5a4a25' },
            { label: 'Spikes L', primitive: 'sphere', position: [-1.2, 3.8, 0], scale: [0.5, 0.5, 0.5], material: 'default', color: '#6a8a4a' },
            { label: 'Spikes R', primitive: 'sphere', position: [1, 4, 0], scale: [0.4, 0.4, 0.4], material: 'default', color: '#6a8a4a' },
            { label: 'Spikes Top', primitive: 'sphere', position: [0, 3.5, 0], scale: [0.45, 0.45, 0.45], material: 'default', color: '#6a8a4a' },
        ],
    },
    {
        id: 'env-ww-rocks', name: 'Desert Rock Formation', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Rock 1', primitive: 'dodecahedron', position: [0, 0.8, 0], scale: [1.5, 1.6, 1.2], material: 'concrete', color: '#9a5a3a' },
            { label: 'Rock 2', primitive: 'dodecahedron', position: [0.5, 2.2, 0.3], scale: [1, 1, 0.8], material: 'concrete', color: '#aa6a4a' },
        ],
    },
    {
        id: 'env-ww-fence', name: 'Split-Rail Fence', era: 'wild-west', category: 'environment',
        nodes: [
            { label: 'Rail 1', primitive: 'box', position: [0, 0.3, 0], scale: [3, 0.08, 0.08], rotation: [0, 10, 0], material: 'wood', color: '#7a6a4a' },
            { label: 'Rail 2', primitive: 'box', position: [0, 0.6, 0], scale: [3, 0.08, 0.08], rotation: [0, 10, 0], material: 'wood', color: '#7a6a4a' },
            { label: 'Rail 3', primitive: 'box', position: [0, 0.9, 0], scale: [3, 0.08, 0.08], rotation: [0, 10, 0], material: 'wood', color: '#7a6a4a' },
        ],
    },
]
