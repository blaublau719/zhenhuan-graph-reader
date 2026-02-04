import { useState, useEffect, useRef } from 'react'
import ePub from 'epubjs'

export default function ChapterReader({ epubUrl, onChapterChange, onTextUpdate }) {
  const viewerRef = useRef(null)
  const [book, setBook] = useState(null)
  const [rendition, setRendition] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [toc, setToc] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!viewerRef.current) return

    // Load the EPUB book
    const newBook = ePub(epubUrl)
    setBook(newBook)

    // Render the book
    const newRendition = newBook.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none'
    })

    newRendition.display()
    setRendition(newRendition)

    // Load table of contents
    newBook.loaded.navigation.then(nav => {
      setToc(nav.toc)
      setIsLoading(false)
    })

    // Track reading progress and extract text
    newRendition.on('rendered', () => {
      // Get current text content
      newRendition.getContents().forEach(contents => {
        const text = contents.document.body.textContent || ''
        onTextUpdate(text)
      })
    })

    // Track location changes
    newRendition.on('relocated', (location) => {
      setCurrentPage(location.start.displayed.page)
      setTotalPages(location.start.displayed.total)

      // Estimate chapter number based on progress
      const progress = location.start.percentage
      const estimatedChapter = Math.max(1, Math.min(5, Math.ceil(progress * 5)))
      onChapterChange(estimatedChapter)

      // Extract text on every page change to update graph
      setTimeout(() => {
        newRendition.getContents().forEach(contents => {
          const text = contents.document.body.textContent || ''
          onTextUpdate(text)
        })
      }, 100)
    })

    // Keyboard navigation
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight') {
        newRendition?.next()
      } else if (e.key === 'ArrowLeft') {
        newRendition?.prev()
      }
    }
    document.addEventListener('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      newRendition?.destroy()
    }
  }, [epubUrl])

  const goToChapter = (href) => {
    if (rendition) {
      rendition.display(href)
    }
  }

  const nextPage = () => rendition?.next()
  const prevPage = () => rendition?.prev()

  return (
    <div className="relative h-full bg-white">
      {/* Header with controls */}
      <div className="absolute top-0 left-0 right-0 bg-amber-800 text-white p-4 z-10 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">甄嬛传 - 流潋紫</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={prevPage}
              className="px-3 py-1 bg-amber-700 rounded hover:bg-amber-600 transition"
            >
              ← 上一页
            </button>
            <button
              onClick={nextPage}
              className="px-3 py-1 bg-amber-700 rounded hover:bg-amber-600 transition"
            >
              下一页 →
            </button>
          </div>
        </div>
      </div>

      {/* EPUB viewer */}
      <div
        ref={viewerRef}
        className="absolute top-16 left-0 right-0 bottom-20 overflow-hidden"
        style={{
          padding: '20px',
          background: '#fff'
        }}
      />

      {/* Table of Contents - collapsible */}
      {!isLoading && toc.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-300 z-10">
          <details className="max-w-3xl mx-auto">
            <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-200">
              📑 目录 ({toc.length} 章节)
            </summary>
            <div className="max-h-48 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
              {toc.map((chapter, index) => (
                <button
                  key={index}
                  onClick={() => goToChapter(chapter.href)}
                  className="text-left px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-amber-100 hover:border-amber-400 transition"
                >
                  {chapter.label}
                </button>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-800 mb-4 mx-auto"></div>
            <p className="text-gray-600">正在加载电子书...</p>
          </div>
        </div>
      )}
    </div>
  )
}
