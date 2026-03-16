/* ====== Prop Recipes — Modern Environment (28 assets) ====== */
import type { PropRecipe } from '../propTypes'

export const MODERN_ENV_RECIPES: PropRecipe[] = [
    // ── Buildings & Structures ──
    {
        id: 'env-mod-office-tower', name: 'Modern Office Tower', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Tower', primitive: 'box', position: [0, 4, 0], scale: [5, 8, 5], material: 'concrete', color: '#2d3748' },
            { label: 'Glass Front', primitive: 'box', position: [0, 4, 2.55], scale: [4.5, 7.5, 0.1], material: 'glass', color: '#6688aa' },
            { label: 'Glass Side', primitive: 'box', position: [2.55, 4, 0], scale: [0.1, 7.5, 4.5], material: 'glass', color: '#6688aa' },
            { label: 'Lobby', primitive: 'box', position: [0, 0.5, 3], scale: [3, 1, 1], material: 'glass', color: '#88aacc' },
            { label: 'Roof Unit', primitive: 'box', position: [1.5, 8.2, 1.5], scale: [1, 0.4, 1], material: 'chrome', color: '#444444' },
        ],
    },
    {
        id: 'env-mod-apartment', name: 'Modern Apartment Building', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'box', position: [0, 3, 0], scale: [8, 6, 6], material: 'concrete', color: '#555555' },
            { label: 'Window Row 1', primitive: 'box', position: [0, 2, 3.05], scale: [6, 0.8, 0.05], material: 'glass', color: '#7799bb' },
            { label: 'Window Row 2', primitive: 'box', position: [0, 4, 3.05], scale: [6, 0.8, 0.05], material: 'glass', color: '#7799bb' },
            { label: 'Balcony', primitive: 'box', position: [2, 4, 3.5], scale: [2, 0.1, 1], material: 'chrome', color: '#666666' },
            { label: 'Ground Shop', primitive: 'box', position: [-2, 0.5, 3.05], scale: [3, 1, 0.1], material: 'glass', color: '#88bbdd' },
        ],
    },
    {
        id: 'env-mod-cafe', name: 'Corner Café', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Building', primitive: 'box', position: [0, 1.5, 0], scale: [5, 3, 4], material: 'concrete', color: '#8a6a4a' },
            { label: 'Window', primitive: 'box', position: [0, 1.5, 2.05], scale: [3, 2, 0.05], material: 'glass', color: '#88aacc' },
            { label: 'Awning', primitive: 'box', position: [0, 2.8, 2.5], scale: [4, 0.08, 1.5], rotation: [8, 0, 0], material: 'default', color: '#2a7a3a' },
            { label: 'Door', primitive: 'box', position: [1.8, 1, 2.05], scale: [0.8, 2, 0.05], material: 'wood', color: '#5a3a18' },
            { label: 'Table 1', primitive: 'cylinder', position: [-1, 0.35, 3], scale: [0.3, 0.7, 0.3], material: 'chrome', color: '#888888' },
            { label: 'Table 2', primitive: 'cylinder', position: [1, 0.35, 3], scale: [0.3, 0.7, 0.3], material: 'chrome', color: '#888888' },
        ],
    },
    {
        id: 'env-mod-gym', name: 'Fitness Center / Gym', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Building', primitive: 'box', position: [0, 2, 0], scale: [8, 4, 6], material: 'concrete', color: '#444444' },
            { label: 'Glass Front', primitive: 'box', position: [0, 2, 3.05], scale: [7, 3.5, 0.05], material: 'glass', color: '#88aacc' },
            { label: 'Accent', primitive: 'box', position: [3, 3, 3.1], scale: [2, 1, 0.05], material: 'neon', color: '#ff6622' },
            { label: 'Door', primitive: 'box', position: [0, 1, 3.05], scale: [1.5, 2, 0.05], material: 'glass', color: '#aaccdd' },
        ],
    },
    {
        id: 'env-mod-library', name: 'Public Library', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Main', primitive: 'box', position: [0, 3, 0], scale: [10, 6, 7], material: 'concrete', color: '#888888' },
            { label: 'Steps', primitive: 'box', position: [0, 0.3, 4], scale: [6, 0.6, 2], material: 'concrete', color: '#999999' },
            { label: 'Column 1', primitive: 'cylinder', position: [-2, 2.5, 3.6], scale: [0.25, 5, 0.25], material: 'concrete', color: '#aaaaaa' },
            { label: 'Column 2', primitive: 'cylinder', position: [0, 2.5, 3.6], scale: [0.25, 5, 0.25], material: 'concrete', color: '#aaaaaa' },
            { label: 'Column 3', primitive: 'cylinder', position: [2, 2.5, 3.6], scale: [0.25, 5, 0.25], material: 'concrete', color: '#aaaaaa' },
            { label: 'Window', primitive: 'box', position: [0, 3.5, 3.55], scale: [5, 2, 0.05], material: 'glass', color: '#88aacc' },
            { label: 'Atrium', primitive: 'box', position: [-4, 3, 0], scale: [3, 6, 5], material: 'glass', color: '#88bbdd' },
        ],
    },
    {
        id: 'env-mod-mall', name: 'Shopping Mall Entrance', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Main', primitive: 'box', position: [0, 4, 0], scale: [12, 8, 8], material: 'concrete', color: '#555555' },
            { label: 'Atrium', primitive: 'box', position: [0, 4, 4.1], scale: [6, 7, 0.1], material: 'glass', color: '#88aacc' },
            { label: 'Canopy', primitive: 'box', position: [0, 7.5, 5], scale: [8, 0.15, 3], material: 'chrome', color: '#777777' },
            { label: 'Door L', primitive: 'box', position: [-1, 1.5, 4.2], scale: [1.5, 2.8, 0.05], material: 'glass', color: '#aaccdd' },
            { label: 'Door R', primitive: 'box', position: [1, 1.5, 4.2], scale: [1.5, 2.8, 0.05], material: 'glass', color: '#aaccdd' },
        ],
    },
    {
        id: 'env-mod-restaurant', name: 'Restaurant', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Building', primitive: 'box', position: [0, 1.5, 0], scale: [6, 3, 5], material: 'wood', color: '#3a2a1a' },
            { label: 'Window', primitive: 'box', position: [0, 1.5, 2.55], scale: [3.5, 2, 0.05], material: 'glass', color: '#ddbb88' },
            { label: 'Door', primitive: 'box', position: [2, 1, 2.55], scale: [0.8, 2, 0.05], material: 'wood', color: '#2a1a0a' },
            { label: 'Awning', primitive: 'box', position: [0, 2.8, 2.8], scale: [5, 0.08, 1], rotation: [8, 0, 0], material: 'default', color: '#222222' },
        ],
    },
    {
        id: 'env-mod-gazebo', name: 'City Park Gazebo', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Floor', primitive: 'cylinder', position: [0, 0.3, 0], scale: [2.5, 0.3, 2.5], material: 'wood', color: '#dddddd' },
            { label: 'Post 1', primitive: 'cylinder', position: [1.5, 1.5, 0], scale: [0.08, 2.4, 0.08], material: 'default', color: '#eeeeee' },
            { label: 'Post 2', primitive: 'cylinder', position: [-1.5, 1.5, 0], scale: [0.08, 2.4, 0.08], material: 'default', color: '#eeeeee' },
            { label: 'Post 3', primitive: 'cylinder', position: [0, 1.5, 1.5], scale: [0.08, 2.4, 0.08], material: 'default', color: '#eeeeee' },
            { label: 'Post 4', primitive: 'cylinder', position: [0, 1.5, -1.5], scale: [0.08, 2.4, 0.08], material: 'default', color: '#eeeeee' },
            { label: 'Roof', primitive: 'cone', position: [0, 3.5, 0], scale: [3.5, 2, 3.5], material: 'default', color: '#555555' },
        ],
    },
    // ── Street Furniture ──
    {
        id: 'env-mod-bench', name: 'Park Bench', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Seat', primitive: 'box', position: [0, 0.4, 0], scale: [1.5, 0.05, 0.5], material: 'wood', color: '#6a4a25' },
            { label: 'Back', primitive: 'box', position: [0, 0.7, -0.22], scale: [1.5, 0.5, 0.05], rotation: [10, 0, 0], material: 'wood', color: '#6a4a25' },
            { label: 'Leg L', primitive: 'box', position: [-0.6, 0.2, 0], scale: [0.05, 0.4, 0.5], material: 'chrome', color: '#2a5a2a' },
            { label: 'Leg R', primitive: 'box', position: [0.6, 0.2, 0], scale: [0.05, 0.4, 0.5], material: 'chrome', color: '#2a5a2a' },
        ],
    },
    {
        id: 'env-mod-streetlight', name: 'Street Light', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Pole', primitive: 'cylinder', position: [0, 2, 0], scale: [0.06, 4, 0.06], material: 'chrome', color: '#222222' },
            { label: 'Arm', primitive: 'cylinder', position: [0.5, 3.8, 0], scale: [0.04, 1.2, 0.04], rotation: [0, 0, -70], material: 'chrome', color: '#222222' },
            { label: 'Lamp', primitive: 'box', position: [1, 4, 0], scale: [0.4, 0.08, 0.2], material: 'default', color: '#ffee88' },
        ],
    },
    {
        id: 'env-mod-busstop', name: 'Bus Stop Shelter', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Roof', primitive: 'box', position: [0, 2.5, 0], scale: [3, 0.08, 1.5], material: 'chrome', color: '#666666' },
            { label: 'Back', primitive: 'box', position: [0, 1.25, -0.7], scale: [3, 2.5, 0.05], material: 'glass', color: '#88bbdd' },
            { label: 'Side L', primitive: 'box', position: [-1.4, 1.25, 0], scale: [0.05, 2.5, 1.5], material: 'glass', color: '#88bbdd' },
            { label: 'Bench', primitive: 'box', position: [0, 0.5, -0.3], scale: [2, 0.06, 0.4], material: 'chrome', color: '#888888' },
        ],
    },
    {
        id: 'env-mod-hydrant', name: 'Fire Hydrant', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'cylinder', position: [0, 0.3, 0], scale: [0.12, 0.6, 0.12], material: 'plastic', color: '#cc2222' },
            { label: 'Top', primitive: 'sphere', position: [0, 0.6, 0], scale: [0.14, 0.1, 0.14], material: 'plastic', color: '#cc2222' },
            { label: 'Port', primitive: 'cylinder', position: [0.12, 0.35, 0], scale: [0.04, 0.1, 0.04], rotation: [0, 0, 90], material: 'chrome', color: '#888888' },
        ],
    },
    {
        id: 'env-mod-trashcan', name: 'Trash Can', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'cylinder', position: [0, 0.4, 0], scale: [0.25, 0.8, 0.25], material: 'chrome', color: '#222222' },
            { label: 'Lid', primitive: 'sphere', position: [0, 0.85, 0], scale: [0.28, 0.1, 0.28], material: 'chrome', color: '#333333' },
        ],
    },
    {
        id: 'env-mod-newsbox', name: 'Newspaper Box', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'box', position: [0, 0.5, 0], scale: [0.3, 0.8, 0.25], material: 'chrome', color: '#2a6a7a' },
            { label: 'Window', primitive: 'box', position: [0, 0.55, 0.13], scale: [0.24, 0.3, 0.01], material: 'glass', color: '#88ccdd' },
        ],
    },
    {
        id: 'env-mod-mailbox', name: 'Mailbox', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'box', position: [0, 0.5, 0], scale: [0.35, 0.9, 0.3], material: 'chrome', color: '#2255aa' },
            { label: 'Top', primitive: 'cylinder', position: [0, 0.98, 0], scale: [0.18, 0.35, 0.15], rotation: [90, 0, 0], material: 'chrome', color: '#2255aa' },
        ],
    },
    // ── Vehicles ──
    {
        id: 'env-mod-sedan', name: 'Sedan Car', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'box', position: [0, 0.5, 0], scale: [4, 0.8, 1.8], material: 'chrome', color: '#333344' },
            { label: 'Cabin', primitive: 'box', position: [0.3, 1.1, 0], scale: [2.2, 0.8, 1.6], material: 'chrome', color: '#333344' },
            { label: 'Windshield', primitive: 'box', position: [-0.6, 1.1, 0], scale: [0.05, 0.7, 1.4], rotation: [0, 0, -15], material: 'glass', color: '#556677' },
            { label: 'Wheel FL', primitive: 'cylinder', position: [-1.2, 0.2, -1], scale: [0.25, 0.12, 0.25], rotation: [90, 0, 0], material: 'rubber', color: '#111111' },
            { label: 'Wheel FR', primitive: 'cylinder', position: [-1.2, 0.2, 1], scale: [0.25, 0.12, 0.25], rotation: [90, 0, 0], material: 'rubber', color: '#111111' },
            { label: 'Wheel RL', primitive: 'cylinder', position: [1.2, 0.2, -1], scale: [0.25, 0.12, 0.25], rotation: [90, 0, 0], material: 'rubber', color: '#111111' },
            { label: 'Wheel RR', primitive: 'cylinder', position: [1.2, 0.2, 1], scale: [0.25, 0.12, 0.25], rotation: [90, 0, 0], material: 'rubber', color: '#111111' },
        ],
    },
    {
        id: 'env-mod-bus', name: 'City Bus', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'box', position: [0, 1.5, 0], scale: [8, 2.5, 2.5], material: 'default', color: '#eeeeee' },
            { label: 'Stripe', primitive: 'box', position: [0, 1.5, 1.28], scale: [8, 0.3, 0.02], material: 'default', color: '#06b6d4' },
            { label: 'Windows', primitive: 'box', position: [0, 2, 1.28], scale: [6, 1, 0.02], material: 'glass', color: '#556677' },
            { label: 'Wheel F', primitive: 'cylinder', position: [-2.5, 0.4, -1.3], scale: [0.4, 0.15, 0.4], rotation: [90, 0, 0], material: 'rubber', color: '#111111' },
            { label: 'Wheel R', primitive: 'cylinder', position: [2.5, 0.4, -1.3], scale: [0.4, 0.15, 0.4], rotation: [90, 0, 0], material: 'rubber', color: '#111111' },
        ],
    },
    {
        id: 'env-mod-van', name: 'Delivery Van', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Cargo', primitive: 'box', position: [0.5, 1.2, 0], scale: [3.5, 2.2, 2], material: 'default', color: '#eeeeee' },
            { label: 'Cab', primitive: 'box', position: [-2, 1, 0], scale: [1.5, 1.8, 2], material: 'default', color: '#eeeeee' },
            { label: 'Windshield', primitive: 'box', position: [-2.8, 1.2, 0], scale: [0.05, 1, 1.6], material: 'glass', color: '#556677' },
            { label: 'Wheel FL', primitive: 'cylinder', position: [-2, 0.3, -1.1], scale: [0.3, 0.12, 0.3], rotation: [90, 0, 0], material: 'rubber', color: '#111111' },
            { label: 'Wheel RR', primitive: 'cylinder', position: [1.5, 0.3, -1.1], scale: [0.3, 0.12, 0.3], rotation: [90, 0, 0], material: 'rubber', color: '#111111' },
        ],
    },
    {
        id: 'env-mod-airplane', name: 'Commercial Jet Airplane', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Fuselage', primitive: 'cylinder', position: [0, 2, 0], scale: [1.5, 18, 1.5], rotation: [0, 0, 90], material: 'default', color: '#eeeeee' },
            { label: 'Nose', primitive: 'sphere', position: [-9.5, 2, 0], scale: [1.5, 1.5, 1.5], material: 'default', color: '#eeeeee' },
            { label: 'Wing L', primitive: 'box', position: [0, 2, -5], scale: [3, 0.2, 8], rotation: [0, 0, 3], material: 'chrome', color: '#cccccc' },
            { label: 'Wing R', primitive: 'box', position: [0, 2, 5], scale: [3, 0.2, 8], rotation: [0, 0, -3], material: 'chrome', color: '#cccccc' },
            { label: 'Tail Fin', primitive: 'box', position: [8, 4, 0], scale: [2, 3, 0.2], material: 'default', color: '#06b6d4' },
            { label: 'Tail Wing L', primitive: 'box', position: [8, 3, -1.5], scale: [1.5, 0.15, 2.5], material: 'chrome', color: '#cccccc' },
            { label: 'Tail Wing R', primitive: 'box', position: [8, 3, 1.5], scale: [1.5, 0.15, 2.5], material: 'chrome', color: '#cccccc' },
            { label: 'Engine L', primitive: 'cylinder', position: [-1, 1.5, -3], scale: [0.6, 1.5, 0.6], rotation: [0, 0, 90], material: 'chrome', color: '#888888' },
            { label: 'Engine R', primitive: 'cylinder', position: [-1, 1.5, 3], scale: [0.6, 1.5, 0.6], rotation: [0, 0, 90], material: 'chrome', color: '#888888' },
            { label: 'Stripe', primitive: 'box', position: [0, 2.78, 0], scale: [16, 0.15, 0.02], material: 'default', color: '#06b6d4' },
            { label: 'Windows', primitive: 'box', position: [0, 2.6, 0.76], scale: [12, 0.2, 0.02], material: 'glass', color: '#556677' },
        ],
    },
    {
        id: 'env-mod-helicopter', name: 'Helicopter', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'sphere', position: [0, 1.5, 0], scale: [3, 1.5, 1.5], material: 'chrome', color: '#1a3a5a' },
            { label: 'Tail Boom', primitive: 'cylinder', position: [3, 1.5, 0], scale: [0.3, 4, 0.3], rotation: [0, 0, 90], material: 'chrome', color: '#1a3a5a' },
            { label: 'Tail Fin', primitive: 'box', position: [5, 2, 0], scale: [0.8, 1.2, 0.08], material: 'chrome', color: '#1a3a5a' },
            { label: 'Tail Rotor', primitive: 'box', position: [5, 2.2, 0.1], scale: [0.08, 0.8, 0.04], material: 'chrome', color: '#444444' },
            { label: 'Cockpit', primitive: 'sphere', position: [-1.2, 1.3, 0], scale: [1.5, 1.2, 1.4], material: 'glass', color: '#88bbdd' },
            { label: 'Main Rotor Hub', primitive: 'cylinder', position: [0, 2.5, 0], scale: [0.15, 0.4, 0.15], material: 'chrome', color: '#444444' },
            { label: 'Rotor Blade 1', primitive: 'box', position: [0, 2.7, 0], scale: [6, 0.04, 0.3], material: 'chrome', color: '#555555' },
            { label: 'Rotor Blade 2', primitive: 'box', position: [0, 2.7, 0], scale: [0.3, 0.04, 6], material: 'chrome', color: '#555555' },
            { label: 'Skid L', primitive: 'box', position: [0, 0.1, -0.6], scale: [2.5, 0.06, 0.06], material: 'chrome', color: '#333333' },
            { label: 'Skid R', primitive: 'box', position: [0, 0.1, 0.6], scale: [2.5, 0.06, 0.06], material: 'chrome', color: '#333333' },
            { label: 'Strut L', primitive: 'cylinder', position: [0, 0.7, -0.6], scale: [0.04, 1.2, 0.04], material: 'chrome', color: '#333333' },
            { label: 'Strut R', primitive: 'cylinder', position: [0, 0.7, 0.6], scale: [0.04, 1.2, 0.04], material: 'chrome', color: '#333333' },
        ],
    },
    // ── Nature ──
    {
        id: 'env-mod-oak', name: 'Oak Tree', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Trunk', primitive: 'cylinder', position: [0, 2, 0], scale: [0.5, 4, 0.5], material: 'wood', color: '#5a3a18' },
            { label: 'Canopy', primitive: 'sphere', position: [0, 5, 0], scale: [4, 3, 4], material: 'default', color: '#2a6a1a' },
        ],
    },
    {
        id: 'env-mod-cherry', name: 'Cherry Blossom Tree', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Trunk', primitive: 'cylinder', position: [0, 1.5, 0], scale: [0.25, 3, 0.25], material: 'wood', color: '#3a2510' },
            { label: 'Canopy', primitive: 'sphere', position: [0, 3.5, 0], scale: [3, 2.5, 3], material: 'default', color: '#e8a0b0' },
        ],
    },
    {
        id: 'env-mod-hedge', name: 'Hedge Row', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Body', primitive: 'box', position: [0, 0.5, 0], scale: [3, 1, 0.6], material: 'default', color: '#1a4a12' },
        ],
    },
    {
        id: 'env-mod-planter', name: 'Flower Planter Box', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Box', primitive: 'box', position: [0, 0.2, 0], scale: [1, 0.4, 0.4], material: 'concrete', color: '#888888' },
            { label: 'Flowers', primitive: 'sphere', position: [0, 0.5, 0], scale: [0.9, 0.3, 0.3], material: 'default', color: '#cc3344' },
        ],
    },
    {
        id: 'env-mod-grass', name: 'Grass Patch', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Ground', primitive: 'plane', position: [0, 0.01, 0], scale: [4, 4, 1], rotation: [-90, 0, 0], material: 'default', color: '#3a8a2a' },
        ],
    },
    // ── Interior Props ──
    {
        id: 'env-mod-desk', name: 'Office Desk with Chair', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Desktop', primitive: 'box', position: [0, 0.75, 0], scale: [1.5, 0.04, 0.7], material: 'default', color: '#eeeeee' },
            { label: 'Leg L', primitive: 'box', position: [-0.7, 0.37, 0], scale: [0.04, 0.74, 0.6], material: 'chrome', color: '#888888' },
            { label: 'Leg R', primitive: 'box', position: [0.7, 0.37, 0], scale: [0.04, 0.74, 0.6], material: 'chrome', color: '#888888' },
            { label: 'Monitor', primitive: 'box', position: [0, 1, -0.2], scale: [0.5, 0.3, 0.02], material: 'chrome', color: '#111111' },
            { label: 'Chair Seat', primitive: 'box', position: [0, 0.45, 0.6], scale: [0.5, 0.05, 0.5], material: 'default', color: '#222222' },
            { label: 'Chair Back', primitive: 'box', position: [0, 0.7, 0.85], scale: [0.5, 0.5, 0.05], material: 'default', color: '#222222' },
        ],
    },
    {
        id: 'env-mod-cafetable', name: 'Café Table Set', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Table Top', primitive: 'cylinder', position: [0, 0.7, 0], scale: [0.5, 0.04, 0.5], material: 'wood', color: '#4a2a10' },
            { label: 'Table Leg', primitive: 'cylinder', position: [0, 0.35, 0], scale: [0.04, 0.7, 0.04], material: 'chrome', color: '#888888' },
            { label: 'Chair 1', primitive: 'box', position: [0.5, 0.35, 0], scale: [0.35, 0.04, 0.35], material: 'wood', color: '#5a3a18' },
            { label: 'Chair 2', primitive: 'box', position: [-0.5, 0.35, 0], scale: [0.35, 0.04, 0.35], material: 'wood', color: '#5a3a18' },
        ],
    },
    {
        id: 'env-mod-gymequip', name: 'Gym Equipment Set', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Treadmill Base', primitive: 'box', position: [-1, 0.15, 0], scale: [1.5, 0.2, 0.6], material: 'chrome', color: '#222222' },
            { label: 'Treadmill Console', primitive: 'box', position: [-1.6, 1, 0], scale: [0.1, 1.2, 0.5], material: 'chrome', color: '#333333' },
            { label: 'Bench', primitive: 'box', position: [1, 0.4, 0], scale: [1.2, 0.08, 0.3], material: 'default', color: '#222222' },
            { label: 'Rack', primitive: 'box', position: [0, 0.6, -1], scale: [1, 1.2, 0.2], material: 'chrome', color: '#444444' },
        ],
    },
    {
        id: 'env-mod-bookshelf', name: 'Bookshelf', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Frame', primitive: 'box', position: [0, 1, 0], scale: [1, 2, 0.3], material: 'wood', color: '#3a2510' },
            { label: 'Shelf 1', primitive: 'box', position: [0, 0.4, 0], scale: [0.95, 0.02, 0.28], material: 'wood', color: '#4a3015' },
            { label: 'Shelf 2', primitive: 'box', position: [0, 0.8, 0], scale: [0.95, 0.02, 0.28], material: 'wood', color: '#4a3015' },
            { label: 'Shelf 3', primitive: 'box', position: [0, 1.2, 0], scale: [0.95, 0.02, 0.28], material: 'wood', color: '#4a3015' },
            { label: 'Shelf 4', primitive: 'box', position: [0, 1.6, 0], scale: [0.95, 0.02, 0.28], material: 'wood', color: '#4a3015' },
            { label: 'Books', primitive: 'box', position: [0, 0.6, 0], scale: [0.9, 0.15, 0.2], material: 'default', color: '#883322' },
        ],
    },
    {
        id: 'env-mod-sofa', name: 'Living Room Sofa', era: 'modern', category: 'environment',
        nodes: [
            { label: 'Base', primitive: 'box', position: [0, 0.25, 0], scale: [2.5, 0.4, 0.9], material: 'fabric', color: '#3a3a3a' },
            { label: 'Back', primitive: 'box', position: [0, 0.6, -0.4], scale: [2.5, 0.5, 0.15], material: 'fabric', color: '#3a3a3a' },
            { label: 'Arm L', primitive: 'box', position: [-1.2, 0.45, 0], scale: [0.15, 0.55, 0.9], material: 'fabric', color: '#3a3a3a' },
            { label: 'Arm R', primitive: 'box', position: [1.2, 0.45, 0], scale: [0.15, 0.55, 0.9], material: 'fabric', color: '#3a3a3a' },
            { label: 'Cushion', primitive: 'box', position: [0.6, 0.5, 0.1], scale: [0.4, 0.15, 0.4], material: 'fabric', color: '#4a4a5a' },
        ],
    },
]
