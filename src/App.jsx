import { useState, useEffect } from 'react'
import ChapterReader from './components/ChapterReader'
import GraphVisualization from './components/GraphVisualization'
import { graphData } from './data/graphData'

function App() {
  const [currentChapter, setCurrentChapter] = useState(1)
  const [readCharacters, setReadCharacters] = useState(new Set())
  const [detectedCharacters, setDetectedCharacters] = useState([])

  // Use base URL for GitHub Pages compatibility
  const epubUrl = `${import.meta.env.BASE_URL}zhenhuan.epub`

  const handleChapterChange = (chapterNum) => {
    setCurrentChapter(chapterNum)
  }

  const handleTextUpdate = (text) => {
    // Scan text for character names
    const chars = new Set()
    graphData.nodes.forEach(node => {
      if (text.includes(node.Label)) {
        chars.add(node.Label)
      }
    })
    setDetectedCharacters(Array.from(chars))
    setReadCharacters(prev => new Set([...prev, ...chars]))
  }

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
