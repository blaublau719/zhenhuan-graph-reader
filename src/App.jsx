import { useState, useEffect, useCallback } from 'react'
import ChapterReader from './components/ChapterReader'
import GraphVisualization from './components/GraphVisualization'
import { graphData } from './data/graphData'

const STORAGE_KEY_CHARS = 'zhenhuan-read-characters'
const STORAGE_KEY_CHAPTER = 'zhenhuan-current-chapter'

function App() {
  // Restore persisted state from localStorage
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

  // Use base URL for GitHub Pages compatibility
  const epubUrl = `${import.meta.env.BASE_URL}zhenhuan.epub`

  // Persist readCharacters whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHARS, JSON.stringify([...readCharacters]))
    } catch { /* ignore storage errors */ }
  }, [readCharacters])

  // Persist currentChapter whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAPTER, String(currentChapter))
    } catch { /* ignore storage errors */ }
  }, [currentChapter])

  const handleChapterChange = useCallback((chapterNum) => {
    setCurrentChapter(chapterNum)
  }, [])

  const handleTextUpdate = useCallback((text) => {
    // Scan text for character names
    const chars = new Set()
    graphData.nodes.forEach(node => {
      if (text.includes(node.Label)) {
        chars.add(node.Label)
      }
    })
    setDetectedCharacters(Array.from(chars))
    setReadCharacters(prev => {
      const merged = new Set([...prev, ...chars])
      if (merged.size === prev.size) return prev // no change, skip re-render
      return merged
    })
  }, [])

  return (
    <div className="flex h-screen bg-gradient-to-br from-amber-100 to-yellow-200">
      <div className="w-[70%] h-full overflow-hidden border-r border-amber-300">
        <ChapterReader
          epubUrl={epubUrl}
          onChapterChange={handleChapterChange}
          onTextUpdate={handleTextUpdate}
        />
      </div>
      <div className="w-[30%] h-full">
        <GraphVisualization
          graphData={graphData}
          currentChapter={currentChapter}
          readCharacters={readCharacters}
          detectedCharacters={detectedCharacters}
        />
      </div>
    </div>
  )
}

export default App
