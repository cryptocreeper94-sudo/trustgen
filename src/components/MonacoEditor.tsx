/* ====== TrustGen — Monaco Editor Wrapper ====== */
/* Thin wrapper around @monaco-editor/react with TrustGen theming */
import { useCallback, useRef } from 'react'
// @ts-ignore — install @monaco-editor/react to resolve
import Editor from '@monaco-editor/react'

interface MonacoEditorProps {
    value: string
    language: string
    onChange: (value: string) => void
    readOnly?: boolean
}

// Map from our simplified language names to Monaco language IDs
const LANGUAGE_MAP: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    markdown: 'markdown',
    python: 'python',
    rust: 'rust',
    go: 'go',
    glsl: 'glsl',
    wgsl: 'plaintext',
    yaml: 'yaml',
    toml: 'plaintext',
    shell: 'shell',
    sql: 'sql',
    xml: 'xml',
    ruby: 'ruby',
    java: 'java',
    plaintext: 'plaintext',
}

function getMonacoLanguage(lang: string): string {
    return LANGUAGE_MAP[lang] || lang || 'plaintext'
}

export function MonacoEditor({ value, language, onChange, readOnly = false }: MonacoEditorProps) {
    const editorRef = useRef<any>(null)
    const isUpdatingRef = useRef(false)

    const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
        editorRef.current = editor

        // Define custom TrustGen Dark theme
        monaco.editor.defineTheme('trustgen-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
                { token: 'keyword', foreground: '22d3ee' },
                { token: 'string', foreground: '34d399' },
                { token: 'number', foreground: 'f59e0b' },
                { token: 'type', foreground: '06b6d4' },
                { token: 'function', foreground: 'a78bfa' },
                { token: 'variable', foreground: 'e2e8f0' },
            ],
            colors: {
                'editor.background': '#0a0b10',
                'editor.foreground': '#e2e8f0',
                'editor.lineHighlightBackground': '#0f1016',
                'editor.selectionBackground': '#06b6d430',
                'editor.inactiveSelectionBackground': '#06b6d415',
                'editorCursor.foreground': '#22d3ee',
                'editorGutter.background': '#080910',
                'editorLineNumber.foreground': '#334155',
                'editorLineNumber.activeForeground': '#06b6d4',
                'editor.selectionHighlightBackground': '#06b6d420',
                'editorBracketMatch.background': '#06b6d420',
                'editorBracketMatch.border': '#06b6d4',
                'editorIndentGuide.activeBackground1': '#1a1b2e',
                'editorIndentGuide.background1': '#0f1016',
                'minimap.background': '#080910',
                'scrollbarSlider.background': '#06b6d420',
                'scrollbarSlider.hoverBackground': '#06b6d440',
                'scrollbarSlider.activeBackground': '#06b6d460',
            },
        })
        monaco.editor.setTheme('trustgen-dark')

        // Add save keyboard shortcut within the editor
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
            window.dispatchEvent(event)
        })
    }, [])

    const handleChange = useCallback((val: any) => {
        if (isUpdatingRef.current) return
        onChange(val || '')
    }, [onChange])

    return (
        <Editor
            height="100%"
            language={getMonacoLanguage(language)}
            value={value}
            onChange={handleChange}
            onMount={handleEditorDidMount}
            theme="trustgen-dark"
            options={{
                automaticLayout: true,
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 2,
                insertSpaces: true,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                padding: { top: 16, bottom: 16 },
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true, indentation: true },
                readOnly,
                renderWhitespace: 'selection',
                suggest: { showKeywords: true, showSnippets: true },
            }}
            loading={
                <div className="studio-editor-loading">
                    <div className="studio-editor-spinner" />
                    <span>Loading editor...</span>
                </div>
            }
        />
    )
}

export default MonacoEditor
