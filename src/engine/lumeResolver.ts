/* ====== TrustGen — Lume Intent Resolver (Domain Validation) ====== */
import { useEngineStore } from '../store'

export interface ResolutionManifest {
    source: string;
    intent: string;
    confidence: number;
    layer: string;
    action: () => void;
}

export function evaluateLumeIntent(input: string): ResolutionManifest | null {
    const text = input.toLowerCase().trim();
    const store = useEngineStore.getState();

    // ── Layer 1: Exact Pattern Match (Lume Grammar) ──
    const spawnPattern = /^(add|spawn|create|make|drop)\s+(a\s+|an\s+|the\s+)?(red|blue|green|massive|tiny|big)?\s*(cube|sphere|cylinder|box|light)/i;
    const spawnMatch = text.match(spawnPattern);
    
    if (spawnMatch) {
        const shapeStr = spawnMatch[4].toLowerCase();
        let primitive: 'box'|'sphere'|'cylinder' = 'box';
        let kind: 'mesh'|'light' = 'mesh';
        
        if (shapeStr === 'cube' || shapeStr === 'box') primitive = 'box';
        if (shapeStr === 'sphere') primitive = 'sphere';
        if (shapeStr === 'cylinder') primitive = 'cylinder';
        if (shapeStr === 'light') kind = 'light';

        return {
            source: input,
            intent: `Create ${kind === 'light' ? 'Point Light' : primitive}`,
            confidence: 0.95,
            layer: "ExactPatternMatch",
            action: () => store.addNode(
                kind === 'light' 
                    ? { kind: 'light', name: 'Lume Light' } 
                    : { kind: 'mesh', name: `Lume ${primitive}`, primitive }
            )
        };
    }

    const toolPattern = /^(use|switch to|select|grab|equip)\s+(the\s+)?(move|translate|rotate|scale|select)\s*(tool)?/i;
    const toolMatch = text.match(toolPattern);
    
    if (toolMatch) {
        let t = toolMatch[3].toLowerCase();
        if (t === 'move') t = 'translate';
        
        return {
            source: input,
            intent: `Set Editor Tool to ${t}`,
            confidence: 0.98,
            layer: "ExactPatternMatch",
            action: () => store.setTool(t as any)
        };
    }

    const deletePattern = /^(delete|remove|destroy|trash)\s+(that|it|this|the selected( object)?)/i;
    if (text.match(deletePattern)) {
        return {
            source: input,
            intent: "Delete selected node(s)",
            confidence: 0.94,
            layer: "Context Engine",
            action: () => {
                const ids = store.editor.selectedNodeIds;
                if (ids.length > 0) ids.forEach(id => store.removeNode(id))
                else if (store.editor.selectedNodeId) store.removeNode(store.editor.selectedNodeId)
            }
        };
    }

    // ── Layer 2: Fuzzy Pattern Match (Tolerance Fallback) ──
    if (text.includes("undo") || text.includes("go back") || text.includes("revert")) {
        return { 
            source: input, 
            intent: "Undo last action", 
            confidence: 0.85, 
            layer: "FuzzyMatch", 
            action: () => store.undo() 
        };
    }
    
    if (text.includes("grid") && (text.includes("hide") || text.includes("show") || text.includes("toggle") || text.includes("turn off"))) {
        return { 
            source: input, 
            intent: "Toggle Viewport Grid", 
            confidence: 0.88, 
            layer: "FuzzyMatch", 
            action: () => useEngineStore.setState(s => ({ editor: { ...s.editor, showGrid: !s.editor.showGrid } }))
        };
    }

    // Unresolved intent
    return null;
}
