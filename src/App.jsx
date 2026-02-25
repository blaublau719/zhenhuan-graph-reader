import { useState, useEffect, useCallback, useMemo } from 'react'
import ChapterReader from './components/ChapterReader'
import GraphVisualization from './components/GraphVisualization'
import { graphData } from './data/graphData'
import { computeGraphState, tocIndexToEventChapter } from './data/chapterEvents'

const STORAGE_KEY_CHARS = 'zhenhuan-read-characters'
const STORAGE_KEY_CHAPTER = 'zhenhuan-current-chapter'
const STORAGE_KEY_THEME = 'zhenhuan-theme'
const STORAGE_KEY_FONT = 'zhenhuan-font'
const STORAGE_KEY_FONTSIZE = 'zhenhuan-fontsize'

const FONT_SIZE_MIN = 12
const FONT_SIZE_MAX = 28
const FONT_SIZE_STEP = 2
const FONT_SIZE_DEFAULT = 18

const FONT_OPTIONS = [
  { label: '宋体', value: '"SimSun", "Songti SC", "Noto Serif SC", serif' },
  { label: '楷体', value: '"KaiTi", "STKaiti", "Kaiti SC", serif' },
  { label: '黑体', value: '"SimHei", "Heiti SC", "Noto Sans SC", sans-serif' },
  { label: '仿宋', value: '"FangSong", "STFangsong", "Fangsong SC", serif' },
]

const THEMES = {
  light: {
    name: '☀️ 浅色模式',
    headerBg: '#92400e',
    headerBtnBg: '#b45309',
    headerBtnHover: '#d97706',
    readerBg: '#dfc792',
    textColor: '#28390b',
    tocBg: '#f3f4f6',
    tocBorder: '#d1d5db',
    tocText: '#1f2937',
    tocBtnBg: '#ffffff',
    tocBtnBorder: '#d1d5db',
    tocBtnHoverBg: '#fef3c7',
    loadingText: '#6b7280',
    appBg: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    borderColor: '#fbbf24',
    graphBg: 'linear-gradient(135deg, #fde68a, #fcd34d)',
    panelBg: 'rgba(255,255,255,0.95)',
    panelText: '#1f2937',
    panelBorder: '#d1d5db',
    legendText: '#374151',
    nodeLabelFill: '#333',
    nodeLabelShadow: '1px 1px 2px rgba(255,255,255,0.8)',
    linkLabelFill: '#666',
    tooltipBg: 'rgba(0,0,0,0.9)',
    tooltipText: '#fff',
    selectBg: '#ffffff',
    selectText: '#1f2937',
  },
  green: {
    name: '🌿 绿色模式',
    headerBg: '#7c9b18',
    headerBtnBg: '#6b8a10',
    headerBtnHover: '#8aaf1e',
    readerBg: '#3e4c0e',
    textColor: '#ffffff',
    tocBg: '#2d3a08',
    tocBorder: '#5a6b2a',
    tocText: '#e5e7eb',
    tocBtnBg: '#4a5c1a',
    tocBtnBorder: '#5a6b2a',
    tocBtnHoverBg: '#5a6b2a',
    loadingText: '#d1d5db',
    appBg: 'linear-gradient(135deg, #3e4c0e, #2d3a08)',
    borderColor: '#5a6b2a',
    graphBg: '#6b7856',
    panelBg: 'rgba(45,58,8,0.95)',
    panelText: '#e5e7eb',
    panelBorder: '#5a6b2a',
    legendText: '#d1d5db',
    nodeLabelFill: '#f3f4f6',
    nodeLabelShadow: '1px 1px 2px rgba(0,0,0,0.6)',
    linkLabelFill: '#d1d5db',
    tooltipBg: 'rgba(30,40,10,0.95)',
    tooltipText: '#fff',
    selectBg: '#4a5c1a',
    selectText: '#e5e7eb',
  },
  dark: {
    name: '🌙 深色模式',
    headerBg: '#205a6d',
    headerBtnBg: '#1a4d5e',
    headerBtnHover: '#2a6a7d',
    readerBg: '#2e444a',
    textColor: '#ffffff',
    tocBg: '#263c42',
    tocBorder: '#3a5a60',
    tocText: '#e5e7eb',
    tocBtnBg: '#34505a',
    tocBtnBorder: '#3a5a60',
    tocBtnHoverBg: '#3a5a60',
    loadingText: '#d1d5db',
    appBg: 'linear-gradient(135deg, #2e444a, #263c42)',
    borderColor: '#3a5a60',
    graphBg: '#4e6d69',
    panelBg: 'rgba(46,68,74,0.95)',
    panelText: '#e5e7eb',
    panelBorder: '#3a5a60',
    legendText: '#d1d5db',
    nodeLabelFill: '#f3f4f6',
    nodeLabelShadow: '1px 1px 2px rgba(0,0,0,0.6)',
    linkLabelFill: '#d1d5db',
    tooltipBg: 'rgba(32,90,109,0.95)',
    tooltipText: '#fff',
    selectBg: '#34505a',
    selectText: '#e5e7eb',
  }
}

const THEME_KEYS = Object.keys(THEMES)

function App() {
  const [currentChapter, setCurrentChapter] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAPTER)
      return saved ? Number(saved) : 1
    } catch { return 1 }
  })

  const [readCharacters, setReadCharacters] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHARS)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })

  const [detectedCharacters, setDetectedCharacters] = useState([])

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME)
      return saved && THEMES[saved] ? saved : 'light'
    } catch { return 'light' }
  })

  const [fontIndex, setFontIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FONT)
      const idx = Number(saved)
      return idx >= 0 && idx < FONT_OPTIONS.length ? idx : 0
    } catch { return 0 }
  })

  const [fontSize, setFontSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEY_FONTSIZE))
      return saved >= FONT_SIZE_MIN && saved <= FONT_SIZE_MAX ? saved : FONT_SIZE_DEFAULT
    } catch { return FONT_SIZE_DEFAULT }
  })

  const [tocChapterIdx, setTocChapterIdx] = useState(-1)
  const [totalTocChapters, setTotalTocChapters] = useState(0)

  const epubUrl = `${import.meta.env.BASE_URL}zhenhuan.epub`
  const themeConfig = THEMES[theme]
  const currentFont = FONT_OPTIONS[fontIndex]

  // Compute event chapter from TOC index and derive dynamic graph state
  const eventChapter = totalTocChapters > 0 && tocChapterIdx >= 0
    ? tocIndexToEventChapter(tocChapterIdx, totalTocChapters)
    : 0

  const dynamicGraph = useMemo(() => {
    if (eventChapter <= 0) return { nodes: graphData.nodes, edges: graphData.edges, currentEvents: [] }
    return computeGraphState(graphData, eventChapter)
  }, [eventChapter])

  // Persist state
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_CHARS, JSON.stringify([...readCharacters])) } catch {}
  }, [readCharacters])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_CHAPTER, String(currentChapter)) } catch {}
  }, [currentChapter])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_THEME, theme) } catch {}
  }, [theme])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_FONT, String(fontIndex)) } catch {}
  }, [fontIndex])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_FONTSIZE, String(fontSize)) } catch {}
  }, [fontSize])

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(prev + FONT_SIZE_STEP, FONT_SIZE_MAX))
  }, [])

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(prev - FONT_SIZE_STEP, FONT_SIZE_MIN))
  }, [])

  const handleChapterChange = useCallback((chapterNum) => {
    setCurrentChapter(chapterNum)
  }, [])

  const handleTocChapterChange = useCallback((idx, total) => {
    setTocChapterIdx(idx)
    setTotalTocChapters(total)
  }, [])

  const handleTextUpdate = useCallback((text) => {
    const chars = new Set()
    graphData.nodes.forEach(node => {
      if (text.includes(node.Label)) {
        chars.add(node.Label)
      }
    })
    setDetectedCharacters(Array.from(chars))
    setReadCharacters(prev => {
      const merged = new Set([...prev, ...chars])
      if (merged.size === prev.size) return prev
      return merged
    })
  }, [])

  return (
    <div className="flex h-screen" style={{ background: themeConfig.appBg }}>
      <div
        className="w-[70%] h-full overflow-hidden"
        style={{ borderRight: `1px solid ${themeConfig.borderColor}` }}
      >
        <ChapterReader
          epubUrl={epubUrl}
          onChapterChange={handleChapterChange}
          onTocChapterChange={handleTocChapterChange}
          onTextUpdate={handleTextUpdate}
          themeConfig={themeConfig}
          fontFamily={currentFont.value}
          fontSize={fontSize}
          onIncreaseFontSize={increaseFontSize}
          onDecreaseFontSize={decreaseFontSize}
          fontOptions={FONT_OPTIONS}
          fontIndex={fontIndex}
          onFontChange={setFontIndex}
          themeKeys={THEME_KEYS}
          themes={THEMES}
          theme={theme}
          onThemeChange={setTheme}
        />
      </div>
      <div className="w-[30%] h-full">
        <GraphVisualization
          graphData={dynamicGraph}
          currentChapter={currentChapter}
          eventChapter={eventChapter}
          currentEvents={dynamicGraph.currentEvents}
          readCharacters={readCharacters}
          detectedCharacters={detectedCharacters}
          themeConfig={themeConfig}
        />
      </div>
    </div>
  )
}

export default App
