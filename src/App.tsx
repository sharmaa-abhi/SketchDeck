import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  Check,
  ChevronDown,
  Circle,
  Cloud,
  Command,
  Download,
  FileImage,
  FileJson,
  Grid3X3,
  HelpCircle,
  Image,
  LayoutTemplate,
  List,
  Moon,
  MoreHorizontal,
  MousePointer2,
  PenLine,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Type,
  Upload,
  WandSparkles,
  X,
} from 'lucide-react'
import {
  Excalidraw,
  exportToBlob,
  exportToSvg,
  serializeAsJSON,
} from '@excalidraw/excalidraw'
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement, Theme } from '@excalidraw/excalidraw/element/types'
import '@excalidraw/excalidraw/index.css'
import './App.css'

type DrawingRecord = {
  id: string
  title: string
  updatedAt: number
  elements: readonly ExcalidrawElement[]
  appState: Partial<AppState>
  files: BinaryFiles
}

type Template = {
  id: string
  title: string
  description: string
  category: string
  accent: string
  icon: string
}

const templates: Template[] = [
  { id: 'blank', title: 'Blank Canvas', description: 'Start with a clean infinite canvas.', category: 'Basics', accent: '#2563eb', icon: '✦' },
  { id: 'flowchart', title: 'Flowchart', description: 'Map a process from start to finish.', category: 'Workflows', accent: '#f97316', icon: '↗' },
  { id: 'mind-map', title: 'Mind Map', description: 'Turn a big idea into connected branches.', category: 'Planning', accent: '#8b5cf6', icon: '◎' },
  { id: 'wireframe', title: 'Wireframe', description: 'Sketch a product screen in minutes.', category: 'Design', accent: '#06b6d4', icon: '▦' },
  { id: 'architecture', title: 'System Architecture', description: 'Visualize services and relationships.', category: 'Engineering', accent: '#22c55e', icon: '⌘' },
  { id: 'brainstorm', title: 'Brainstorming', description: 'Capture ideas without losing momentum.', category: 'Ideation', accent: '#ec4899', icon: '✳' },
  { id: 'journey', title: 'User Journey', description: 'Explore a customer experience end to end.', category: 'Research', accent: '#eab308', icon: '→' },
  { id: 'planning', title: 'Project Planning', description: 'Give milestones and tasks a clear shape.', category: 'Planning', accent: '#6366f1', icon: '◫' },
]

const DB_NAME = 'sketchdeck-local'
const STORE_NAME = 'drawings'

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const getDrawings = async (): Promise<DrawingRecord[]> => {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    request.onsuccess = () =>
      resolve((request.result as DrawingRecord[]).sort((a, b) => b.updatedAt - a.updatedAt))
    request.onerror = () => reject(request.error)
  })
}

const getDrawing = async (id: string) => {
  const db = await openDatabase()
  return new Promise<DrawingRecord | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result as DrawingRecord | undefined)
    request.onerror = () => reject(request.error)
  })
}

const saveDrawing = async (drawing: DrawingRecord) => {
  const db = await openDatabase()
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(drawing)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return `Edited ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  }
  return `Edited ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
}

const createId = () => `drawing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const makeElement = (
  type: 'rectangle' | 'ellipse' | 'diamond' | 'text' | 'arrow',
  x: number,
  y: number,
  width: number,
  height: number,
  text?: string,
): ExcalidrawElement => {
  const now = Date.now()
  const base = {
    id: `${type}-${now}-${Math.random().toString(36).slice(2, 7)}`,
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: '#1d2939',
    backgroundColor: type === 'text' ? 'transparent' : '#f8fafc',
    fillStyle: 'solid' as const,
    strokeWidth: 2,
    strokeStyle: 'solid' as const,
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    index: null,
    points: type === 'arrow' ? [[0, 0], [width, height]] : [[0, 0]],
    roundness: type === 'rectangle' ? { type: 3 } : null,
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 100000),
    isDeleted: false,
    boundElements: type === 'text' ? null : [],
    updated: now,
    link: null,
    locked: false,
  }

  if (type === 'text') {
    return {
      ...base,
      type: 'text',
      text: text ?? 'New idea',
      originalText: text ?? 'New idea',
      fontSize: 24,
      fontFamily: 1,
      textAlign: 'left',
      verticalAlign: 'top',
      containerId: null,
      autoResize: true,
      lineHeight: 1.25,
    } as unknown as ExcalidrawElement
  }

  return { ...base, type, startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: type === 'arrow' ? 'arrow' : null } as unknown as ExcalidrawElement
}

const templateElements = (templateId: string): ExcalidrawElement[] => {
  if (templateId === 'blank') return []
  if (templateId === 'mind-map') {
    return [
      makeElement('ellipse', 550, 250, 260, 110),
      makeElement('text', 610, 285, 140, 35, 'Core idea'),
      makeElement('rectangle', 230, 120, 210, 90),
      makeElement('text', 275, 148, 120, 30, 'Explore'),
      makeElement('rectangle', 920, 120, 210, 90),
      makeElement('text', 965, 148, 120, 30, 'Connect'),
      makeElement('rectangle', 230, 430, 210, 90),
      makeElement('text', 275, 458, 120, 30, 'Build'),
      makeElement('rectangle', 920, 430, 210, 90),
      makeElement('text', 965, 458, 120, 30, 'Share'),
      makeElement('arrow', 440, 190, 110, 100),
      makeElement('arrow', 810, 190, 110, 100),
      makeElement('arrow', 440, 430, 110, -90),
      makeElement('arrow', 810, 430, 110, -90),
    ]
  }
  if (templateId === 'flowchart') {
    return [
      makeElement('ellipse', 540, 100, 220, 90),
      makeElement('text', 600, 130, 110, 30, 'Start'),
      makeElement('rectangle', 500, 270, 300, 100),
      makeElement('text', 570, 305, 160, 30, 'Gather input'),
      makeElement('diamond', 520, 470, 260, 150),
      makeElement('text', 585, 530, 130, 30, 'Ready?'),
      makeElement('arrow', 650, 190, 0, 80),
      makeElement('arrow', 650, 370, 0, 100),
      makeElement('arrow', 520, 545, -180, 0),
      makeElement('text', 350, 515, 100, 30, 'No'),
      makeElement('arrow', 780, 545, 180, 0),
      makeElement('text', 930, 515, 100, 30, 'Yes'),
    ]
  }
  return [
    makeElement('text', 430, 160, 300, 45, templateId === 'wireframe' ? 'Product wireframe' : 'Project canvas'),
    makeElement('rectangle', 350, 270, 460, 110),
    makeElement('text', 420, 305, 320, 30, 'Drag, drop, and make it yours'),
    makeElement('rectangle', 350, 450, 210, 120),
    makeElement('rectangle', 600, 450, 210, 120),
  ]
}

const newDrawing = (templateId = 'blank'): DrawingRecord => ({
  id: createId(),
  title: templateId === 'blank' ? 'Untitled canvas' : templates.find((item) => item.id === templateId)?.title ?? 'Untitled canvas',
  updatedAt: Date.now(),
  elements: templateElements(templateId),
  appState: { viewBackgroundColor: '#f7f9fc', theme: 'light' },
  files: {},
})

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('sketchdeck-theme') as Theme) || 'light')

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((nextPath: string) => {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current: Theme) => {
      const next = current === 'light' ? 'dark' : 'light'
      localStorage.setItem('sketchdeck-theme', next)
      return next
    })
  }, [])

  if (path.startsWith('/editor/')) {
    return <EditorPage id={path.split('/')[2]} theme={theme} toggleTheme={toggleTheme} navigate={navigate} />
  }

  return <Dashboard theme={theme} toggleTheme={toggleTheme} navigate={navigate} />
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <div className="brand-mark"><span /><span /><span /></div>
      <span className="brand-name">Sketch<span>Deck</span></span>
    </div>
  )
}

function ThemeButton({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  return (
    <button className="icon-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title="Toggle theme">
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}

function Dashboard({ theme, toggleTheme, navigate }: { theme: Theme; toggleTheme: () => void; navigate: (path: string) => void }) {
  const [drawings, setDrawings] = useState<DrawingRecord[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [showTemplates, setShowTemplates] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try {
      setDrawings(await getDrawings())
    } catch {
      setNotice('Local storage is unavailable in this browser session.')
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const createDrawing = async (templateId = 'blank') => {
    const drawing = newDrawing(templateId)
    try {
      await saveDrawing(drawing)
      navigate(`/editor/${drawing.id}`)
    } catch {
      setNotice('Unable to create a local drawing.')
    }
  }

  const filteredDrawings = drawings.filter((drawing) => drawing.title.toLowerCase().includes(search.toLowerCase()))
  const recent = filteredDrawings.slice(0, 4)

  return (
    <div className="app-shell dashboard-shell" data-theme={theme}>
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-workspace">
          <div className="workspace-avatar">SD</div>
          <div><strong>Personal space</strong><span>Local workspace</span></div>
          <ChevronDown size={16} />
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className="nav-item active"><LayoutTemplate size={17} /> Overview</button>
          <button className="nav-item" onClick={() => setShowTemplates(true)}><Sparkles size={17} /> Templates <span className="nav-badge">8</span></button>
          <button className="nav-item"><Trash2 size={17} /> Trash</button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><Settings2 size={17} /> Preferences</button>
          <button className="nav-item"><HelpCircle size={17} /> Help center</button>
          <div className="sidebar-footnote"><Cloud size={16} /><span>Saved locally in your browser</span></div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div className="mobile-brand"><Brand compact /></div>
          <div className="topbar-spacer" />
          <button className="topbar-link"><Command size={16} /> Shortcuts</button>
          <ThemeButton theme={theme} toggleTheme={toggleTheme} />
          <button className="avatar-button">AS</button>
        </header>

        <div className="dashboard-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow"><span className="status-dot" /> Your creative workspace</p>
              <h1>Make space for <em>big ideas.</em></h1>
              <p className="welcome-copy">Think. Sketch. Connect. Turn the first spark into something everyone can see.</p>
            </div>
            <button className="primary-button" onClick={() => void createDrawing()}><Plus size={18} /> New drawing</button>
          </section>

          <section className="quick-start">
            <div className="section-heading">
              <div><h2>Start with a template</h2><p>A little structure can take you a long way.</p></div>
              <button className="text-button" onClick={() => setShowTemplates(true)}>View all <ArrowRight size={15} /></button>
            </div>
            <div className="template-grid">
              {templates.slice(0, 4).map((template) => (
                <button className="template-card" key={template.id} onClick={() => void createDrawing(template.id)}>
                  <TemplatePreview template={template} />
                  <div className="template-card-footer"><div><strong>{template.title}</strong><span>{template.category}</span></div><ArrowUp size={15} className="template-arrow" /></div>
                </button>
              ))}
            </div>
          </section>

          <section className="recent-section">
            <div className="section-heading recent-heading">
              <div><h2>Recent drawings</h2><p>Your latest ideas, ready when you are.</p></div>
              <div className="list-actions">
                <div className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search drawings" /></div>
                <button className="icon-button"><List size={17} /></button>
              </div>
            </div>
            <div className="filter-row">
              {['All', 'Recently edited', 'Shared with me'].map((filter) => <button key={filter} className={activeFilter === filter ? 'filter active' : 'filter'} onClick={() => setActiveFilter(filter)}>{filter}</button>)}
            </div>
            {recent.length > 0 ? (
              <div className="drawing-list">
                {recent.map((drawing) => (
                  <button className="drawing-row" key={drawing.id} onClick={() => navigate(`/editor/${drawing.id}`)}>
                    <div className="drawing-thumb"><MiniCanvas elements={drawing.elements} /></div>
                    <div className="drawing-info"><strong>{drawing.title}</strong><span>{formatDate(drawing.updatedAt)} <i>•</i> Private</span></div>
                    <span className="drawing-count">{drawing.elements.length} objects</span><MoreHorizontal size={18} className="row-more" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-drawings"><div className="empty-icon"><PenLine size={21} /></div><strong>No drawings yet</strong><span>Start with a blank canvas or choose a template above.</span><button className="secondary-button" onClick={() => void createDrawing()}><Plus size={16} /> Create a drawing</button></div>
            )}
          </section>
        </div>
      </main>
      {showTemplates && <TemplateModal onClose={() => setShowTemplates(false)} onSelect={(id) => void createDrawing(id)} />}
      {notice && <Toast message={notice} onClose={() => setNotice('')} />}
    </div>
  )
}

function TemplatePreview({ template }: { template: Template }) {
  return <div className="template-preview" style={{ '--template-accent': template.accent } as React.CSSProperties}><span className="preview-orb">{template.icon}</span><span className="preview-line line-one" /><span className="preview-line line-two" /><span className="preview-line line-three" /><span className="preview-label">{template.title}</span></div>
}

function MiniCanvas({ elements }: { elements: readonly ExcalidrawElement[] }) {
  return <svg viewBox="0 0 180 90" aria-hidden="true">{elements.slice(0, 12).map((element) => <rect key={element.id} x={Math.max(4, element.x / 8)} y={Math.max(3, element.y / 8)} width={Math.max(8, element.width / 8)} height={Math.max(4, Math.abs(element.height) / 8)} rx="2" fill={element.backgroundColor === 'transparent' ? 'none' : element.backgroundColor} stroke="#7b8798" strokeWidth="1" />)}</svg>
}

function TemplateModal({ onClose, onSelect }: { onClose: () => void; onSelect: (id: string) => void }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="template-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">SketchDeck library</p><h2>Choose your starting point</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><div className="modal-template-grid">{templates.map((template) => <button className="modal-template" key={template.id} onClick={() => onSelect(template.id)}><TemplatePreview template={template} /><strong>{template.title}</strong><span>{template.description}</span></button>)}</div></section></div>
}

function EditorPage({ id, theme, toggleTheme, navigate }: { id: string; theme: Theme; toggleTheme: () => void; navigate: (path: string) => void }) {
  const [drawing, setDrawing] = useState<DrawingRecord | null>(null)
  const [title, setTitle] = useState('Untitled canvas')
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saved')
  const [showExport, setShowExport] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [notice, setNotice] = useState('')
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const saveTimer = useRef<number | undefined>(undefined)
  const pendingSave = useRef<{ elements: readonly ExcalidrawElement[]; appState: Partial<AppState>; files: BinaryFiles } | null>(null)

  useEffect(() => {
    void getDrawing(id).then((record) => {
      if (record) {
        setDrawing(record)
        setTitle(record.title)
      } else {
        const fresh = newDrawing()
        fresh.id = id
        setDrawing(fresh)
      }
    }).catch(() => setNotice('Could not restore this drawing.'))
  }, [id])

  const persist = useCallback((elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
    if (!drawing) return
    pendingSave.current = {
      elements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        theme: appState.theme,
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
        zoom: appState.zoom,
      },
      files,
    }
    if (saveTimer.current !== undefined) return
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = undefined
      const nextSave = pendingSave.current
      pendingSave.current = null
      if (!nextSave) return
      void saveDrawing({ ...drawing, title, updatedAt: Date.now(), ...nextSave }).then(() => setSaveState('saved')).catch(() => setSaveState('error'))
    }, 500)
  }, [drawing, title])

  const exportFile = async (kind: 'png' | 'svg' | 'json') => {
    if (!apiRef.current) return
    const elements = apiRef.current.getSceneElements()
    const appState = apiRef.current.getAppState()
    const files = apiRef.current.getFiles()
    if (kind === 'json') {
      download(new Blob([serializeAsJSON(elements, appState, files, 'local')], { type: 'application/json' }), `${title}.excalidraw`)
    } else if (kind === 'png') {
      const blob = await exportToBlob({ elements, appState, files, mimeType: 'image/png', exportPadding: 32 })
      download(blob, `${title}.png`)
    } else {
      const svg = await exportToSvg({ elements, appState, files, exportPadding: 32 })
      download(new Blob([svg.outerHTML], { type: 'image/svg+xml' }), `${title}.svg`)
    }
    setShowExport(false)
    setNotice(`${kind.toUpperCase()} export ready`)
  }

  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !apiRef.current) return
    try {
      const data = JSON.parse(await file.text()) as { elements?: ExcalidrawElement[]; appState?: Partial<AppState>; files?: BinaryFiles }
      apiRef.current.updateScene({ elements: data.elements ?? [], appState: data.appState as AppState, captureUpdate: 'IMMEDIATELY' })
      if (data.files) apiRef.current.addFiles(Object.values(data.files))
      setNotice('Drawing imported')
    } catch {
      setNotice('That file could not be imported.')
    }
    event.target.value = ''
  }

  const setTool = (tool: string) => {
    apiRef.current?.setActiveTool({ type: tool } as never)
  }

  if (!drawing) return <div className="loading-screen"><div className="brand-mark"><span /><span /><span /></div><span>Loading your canvas…</span></div>

  return <div className="editor-shell" data-theme={theme}>
    <header className="editor-header">
      <div className="editor-header-left"><button className="back-button" onClick={() => navigate('/')}><ArrowLeft size={17} /><span>Workspace</span></button><div className="header-divider" /><Brand compact /><div className="title-editor"><input value={title} onChange={(event) => setTitle(event.target.value)} onBlur={() => { if (drawing) void saveDrawing({ ...drawing, title, updatedAt: Date.now() }) }} /><span className={saveState === 'error' ? 'save-status error' : 'save-status'}>{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : <><Check size={13} /> Saved locally</>}</span></div></div>
      <div className="editor-header-right"><button className="editor-action" onClick={() => setShowShortcuts(true)}><Command size={16} /><span>Shortcuts</span></button><ThemeButton theme={theme} toggleTheme={toggleTheme} /><div className="export-wrap"><button className="primary-button export-button" onClick={() => setShowExport((value) => !value)}><Download size={16} /> Export <ChevronDown size={14} /></button>{showExport && <div className="export-menu"><button onClick={() => void exportFile('png')}><FileImage size={16} /> PNG image</button><button onClick={() => void exportFile('svg')}><FileImage size={16} /> SVG vector</button><button onClick={() => void exportFile('json')}><FileJson size={16} /> Excalidraw JSON</button></div>}</div></div>
    </header>
    <div className="editor-body">
      <div className="editor-floating-toolbar">
        <ToolButton icon={<MousePointer2 />} label="Select" onClick={() => setTool('selection')} active />
        <ToolButton icon={<Square />} label="Rectangle" onClick={() => setTool('rectangle')} />
        <ToolButton icon={<Circle />} label="Ellipse" onClick={() => setTool('ellipse')} />
        <ToolButton icon={<span className="diamond-icon" />} label="Diamond" onClick={() => setTool('diamond')} />
        <ToolButton icon={<ArrowRight />} label="Arrow" onClick={() => setTool('arrow')} />
        <ToolButton icon={<PenLine />} label="Draw" onClick={() => setTool('freedraw')} />
        <ToolButton icon={<Type />} label="Text" onClick={() => setTool('text')} />
        <ToolButton icon={<Image />} label="Image" onClick={() => setTool('image')} />
        <ToolButton icon={<Grid3X3 />} label="Show grid" onClick={() => apiRef.current?.updateScene({ appState: { gridSize: 20 } })} />
      </div>
      <div className="editor-toolbar"><ToolButton icon={<MousePointer2 />} label="Select" onClick={() => setTool('selection')} active /><ToolButton icon={<Square />} label="Rectangle" onClick={() => setTool('rectangle')} /><ToolButton icon={<Circle />} label="Ellipse" onClick={() => setTool('ellipse')} /><ToolButton icon={<span className="diamond-icon" />} label="Diamond" onClick={() => setTool('diamond')} /><ToolButton icon={<ArrowRight />} label="Arrow" onClick={() => setTool('arrow')} /><ToolButton icon={<PenLine />} label="Draw" onClick={() => setTool('freedraw')} /><ToolButton icon={<Type />} label="Text" onClick={() => setTool('text')} /><ToolButton icon={<Image />} label="Image" onClick={() => setTool('image')} /><div className="toolbar-divider" /><ToolButton icon={<Grid3X3 />} label="Show grid" onClick={() => apiRef.current?.updateScene({ appState: { gridSize: 20 } })} /></div>
      <div className="canvas-wrap"><Excalidraw theme={theme} initialData={{ elements: drawing.elements, appState: drawing.appState as AppState, files: drawing.files }} excalidrawAPI={(api) => { apiRef.current = api }} onChange={(elements, appState, files) => persist(elements as readonly ExcalidrawElement[], appState, files)} name="SketchDeck" UIOptions={{ canvasActions: { export: false, saveToActiveFile: false, loadScene: false, clearCanvas: true, toggleTheme: false, saveAsImage: false }, tools: { image: true } }} /></div>
      <div className="canvas-help">To move canvas, hold mouse wheel or spacebar while dragging, or use the hand tool.</div>
      <aside className="property-panel"><div className="property-panel-header"><span>Inspector</span><button className="icon-button"><MoreHorizontal size={17} /></button></div><div className="inspector-empty"><div className="inspector-icon"><WandSparkles size={18} /></div><strong>Shape styling</strong><span>Select an object to edit its appearance, text, and position.</span></div><div className="tips-card"><div className="tips-title"><Sparkles size={14} /> Quick tip</div><p>Double-click any shape to add a label. Hold <kbd>Space</kbd> to pan around the canvas.</p></div></aside>
    </div>
    <div className="editor-footer"><div className="footer-hint"><span className="key-pair"><kbd>⌘</kbd><kbd>K</kbd></span> Command menu</div><div className="footer-center"><span><span className="live-dot" /> Local only</span><span className="footer-separator" /><span>Infinite canvas</span></div><label className="import-button"><Upload size={15} /> Import <input type="file" accept=".json,.excalidraw,application/json" onChange={importFile} /></label></div>
    {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    {notice && <Toast message={notice} onClose={() => setNotice('')} />}
  </div>
}

function ToolButton({ icon, label, onClick, active = false }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return <button className={`tool-button ${active ? 'active' : ''}`} onClick={onClick} title={label} aria-label={label}>{icon}</button>
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [['Undo', '⌘ Z'], ['Redo', '⌘ ⇧ Z'], ['Select all', '⌘ A'], ['Duplicate', '⌘ D'], ['Delete', '⌫'], ['Pan canvas', 'Space + drag']]
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="shortcuts-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">Keyboard shortcuts</p><h2>Move faster with your hands</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><div className="shortcut-list">{shortcuts.map(([name, key]) => <div key={name}><span>{name}</span><kbd>{key}</kbd></div>)}</div></section></div>
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 2800); return () => window.clearTimeout(timer) }, [message, onClose])
  return <div className="toast"><Bell size={16} /><span>{message}</span><button onClick={onClose}><X size={14} /></button></div>
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default App
