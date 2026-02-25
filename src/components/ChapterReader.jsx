import { useState, useEffect, useRef } from 'react'
import ePub from 'epubjs'

const STORAGE_KEY_LOCATION = 'zhenhuan-epub-location'

export default function ChapterReader({
  epubUrl,
  onChapterChange,
  onTextUpdate,
  themeConfig,
  fontFamily,
  fontLabel,
  onToggleTheme,
  onCycleFont,
}) {
  const viewerRef = useRef(null)
  const renditionRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [toc, setToc] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize epub once
  useEffect(() => {
    if (!viewerRef.current) return

    const newBook = ePub(epubUrl)

    const newRendition = newBook.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none'
    })

    renditionRef.current = newRendition

    // Apply initial theme styles
    newRendition.themes.default({
      body: {
        color: `${themeConfig.textColor} !important`,
        'font-family': `${fontFamily} !important`,
        'font-weight': '500 !important',
        'background-color': `${themeConfig.readerBg} !important`,
      },
      'p, div, span, h1, h2, h3, h4, h5, h6, li, a': {
        color: `${themeConfig.textColor} !important`,
        'font-family': `${fontFamily} !important`,
        'font-weight': '500 !important',
      }
    })

    // Restore saved reading position
    const savedLocation = (() => {
      try { return localStorage.getItem(STORAGE_KEY_LOCATION) } catch { return null }
    })()
    newRendition.display(savedLocation || undefined)

    // Load table of contents
    newBook.loaded.navigation.then(nav => {
      setToc(nav.toc)
      setIsLoading(false)
    })

    // Reliable text extraction via content hook
    newRendition.hooks.content.register((contents) => {
      const text = contents.document.body.textContent || ''
      onTextUpdate(text)
    })

    // Track location changes and persist reading position
    newRendition.on('relocated', (location) => {
      setCurrentPage(location.start.displayed.page)
      setTotalPages(location.start.displayed.total)

      const progress = location.start.percentage
      const estimatedChapter = Math.max(1, Math.min(5, Math.ceil(progress * 5)))
      onChapterChange(estimatedChapter)

      try {
        if (location.start.cfi) {
          localStorage.setItem(STORAGE_KEY_LOCATION, location.start.cfi)
        }
      } catch {}
    })

    // Keyboard navigation
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        newRendition?.next()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        newRendition?.prev()
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    newRendition.on('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      newRendition?.destroy()
      renditionRef.current = null
    }
  }, [epubUrl])

  // Update epub theme when themeConfig or fontFamily changes (without re-creating rendition)
  useEffect(() => {
    const r = renditionRef.current
    if (!r) return

    r.themes.default({
      body: {
        color: `${themeConfig.textColor} !important`,
        'font-family': `${fontFamily} !important`,
        'font-weight': '500 !important',
        'background-color': `${themeConfig.readerBg} !important`,
      },
      'p, div, span, h1, h2, h3, h4, h5, h6, li, a': {
        color: `${themeConfig.textColor} !important`,
        'font-family': `${fontFamily} !important`,
        'font-weight': '500 !important',
      }
    })

    // Force re-render current page to apply new styles
    r.getContents().forEach(contents => {
      const body = contents.document.body
      if (body) {
        body.style.color = themeConfig.textColor
        body.style.fontFamily = fontFamily
        body.style.fontWeight = '500'
        body.style.backgroundColor = themeConfig.readerBg

        body.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li, a').forEach(el => {
          el.style.color = themeConfig.textColor
          el.style.fontFamily = fontFamily
          el.style.fontWeight = '500'
        })
      }
    })
  }, [themeConfig, fontFamily])

  const goToChapter = (href) => {
    if (renditionRef.current) {
      renditionRef.current.display(href)
    }
  }

  const nextPage = () => renditionRef.current?.next()
  const prevPage = () => renditionRef.current?.prev()

  return (
    <div className="relative h-full" style={{ background: themeConfig.readerBg }}>
      {/* Header with controls */}
      <div
        className="absolute top-0 left-0 right-0 text-white p-3 z-10 shadow-lg"
        style={{ background: themeConfig.headerBg }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold whitespace-nowrap">甄嬛传</h1>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              className="px-2 py-1 rounded transition text-sm"
              style={{ background: themeConfig.headerBtnBg }}
              title="切换主题"
            >
              {themeConfig.name}
            </button>

            {/* Font selector */}
            <button
              onClick={onCycleFont}
              className="px-2 py-1 rounded transition text-sm"
              style={{ background: themeConfig.headerBtnBg }}
              title="切换字体"
            >
              字 {fontLabel}
            </button>

            <span className="text-xs opacity-80">
              {currentPage}/{totalPages}
            </span>

            <button
              onClick={prevPage}
              className="px-2 py-1 rounded transition text-sm"
              style={{ background: themeConfig.headerBtnBg }}
            >
              ← 上一页
            </button>
            <button
              onClick={nextPage}
              className="px-2 py-1 rounded transition text-sm"
              style={{ background: themeConfig.headerBtnBg }}
            >
              下一页 →
            </button>
          </div>
        </div>
      </div>

      {/* EPUB viewer */}
      <div
        ref={viewerRef}
        className="absolute top-14 left-0 right-0 bottom-16 overflow-hidden"
        style={{
          padding: '20px',
          background: themeConfig.readerBg,
        }}
      />

      {/* Table of Contents - collapsible */}
      {!isLoading && toc.length > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 z-10"
          style={{
            background: themeConfig.tocBg,
            borderTop: `1px solid ${themeConfig.tocBorder}`,
          }}
        >
          <details className="max-w-3xl mx-auto">
            <summary
              className="cursor-pointer p-3 font-semibold text-sm"
              style={{ color: themeConfig.tocText }}
            >
              📑 目录 ({toc.length} 章节)
            </summary>
            <div className="max-h-48 overflow-y-auto p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
              {toc.map((chapter, index) => (
                <button
                  key={index}
                  onClick={() => goToChapter(chapter.href)}
                  className="text-left px-3 py-2 text-sm rounded transition"
                  style={{
                    background: themeConfig.tocBtnBg,
                    border: `1px solid ${themeConfig.tocBtnBorder}`,
                    color: themeConfig.tocText,
                  }}
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
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: themeConfig.readerBg }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-800 mb-4 mx-auto"></div>
            <p style={{ color: themeConfig.loadingText }}>正在加载电子书...</p>
          </div>
        </div>
      )}
    </div>
  )
}
