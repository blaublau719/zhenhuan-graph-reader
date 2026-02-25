import { useState, useEffect, useRef } from 'react'
import ePub from 'epubjs'

const STORAGE_KEY_LOCATION = 'zhenhuan-epub-location'

// Extract filename from href for reliable comparison (strip path prefix and anchor)
const hrefBasename = (href) => {
  if (!href) return ''
  return href.replace(/^.*\//, '').replace(/#.*$/, '')
}

export default function ChapterReader({
  epubUrl,
  onChapterChange,
  onTextUpdate,
  themeConfig,
  fontFamily,
  fontSize,
  onIncreaseFontSize,
  onDecreaseFontSize,
  fontOptions,
  fontIndex,
  onFontChange,
  themeKeys,
  themes,
  theme,
  onThemeChange,
}) {
  const viewerRef = useRef(null)
  const renditionRef = useRef(null)
  const bookRef = useRef(null)
  const locationsReadyRef = useRef(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [toc, setToc] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentChapterHref, setCurrentChapterHref] = useState(null)
  const [overallProgress, setOverallProgress] = useState(0)

  // Initialize epub once
  useEffect(() => {
    if (!viewerRef.current) return

    const newBook = ePub(epubUrl)
    bookRef.current = newBook

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
        'font-size': `${fontSize}px !important`,
        'background-color': `${themeConfig.readerBg} !important`,
      },
      'p, div, span, h1, h2, h3, h4, h5, h6, li, a': {
        color: `${themeConfig.textColor} !important`,
        'font-family': `${fontFamily} !important`,
        'font-weight': '500 !important',
        'font-size': `${fontSize}px !important`,
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

    // Generate locations for accurate progress percentage
    newBook.ready.then(() => {
      return newBook.locations.generate(1024)
    }).then(() => {
      locationsReadyRef.current = true
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

      // Use locations-based percentage if available, fallback to atEnd for basic progress
      if (locationsReadyRef.current && location.start.cfi) {
        const pct = newBook.locations.percentageFromCfi(location.start.cfi)
        setOverallProgress(Math.round(pct * 100))
      }
      const progress = locationsReadyRef.current && location.start.cfi
        ? newBook.locations.percentageFromCfi(location.start.cfi)
        : location.start.percentage || 0
      const estimatedChapter = Math.max(1, Math.min(5, Math.ceil(progress * 5)))
      onChapterChange(estimatedChapter)

      // Track current chapter href for TOC highlighting (store just the filename)
      if (location.start.href) {
        setCurrentChapterHref(location.start.href)
      }

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
      bookRef.current = null
      locationsReadyRef.current = false
    }
  }, [epubUrl])

  // Update epub theme when themeConfig, fontFamily, or fontSize changes
  useEffect(() => {
    const r = renditionRef.current
    if (!r) return

    r.themes.default({
      body: {
        color: `${themeConfig.textColor} !important`,
        'font-family': `${fontFamily} !important`,
        'font-weight': '500 !important',
        'font-size': `${fontSize}px !important`,
        'background-color': `${themeConfig.readerBg} !important`,
      },
      'p, div, span, h1, h2, h3, h4, h5, h6, li, a': {
        color: `${themeConfig.textColor} !important`,
        'font-family': `${fontFamily} !important`,
        'font-weight': '500 !important',
        'font-size': `${fontSize}px !important`,
      }
    })

    // Force re-render current page to apply new styles
    r.getContents().forEach(contents => {
      const body = contents.document.body
      if (body) {
        body.style.color = themeConfig.textColor
        body.style.fontFamily = fontFamily
        body.style.fontWeight = '500'
        body.style.fontSize = `${fontSize}px`
        body.style.backgroundColor = themeConfig.readerBg

        body.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li, a').forEach(el => {
          el.style.color = themeConfig.textColor
          el.style.fontFamily = fontFamily
          el.style.fontWeight = '500'
          el.style.fontSize = `${fontSize}px`
        })
      }
    })
  }, [themeConfig, fontFamily, fontSize])

  const goToChapter = (href) => {
    if (renditionRef.current) {
      renditionRef.current.display(href)
    }
  }

  const nextPage = () => renditionRef.current?.next()
  const prevPage = () => renditionRef.current?.prev()

  // Derive current chapter label and index from TOC (compare basenames to avoid path prefix mismatch)
  const currentBase = hrefBasename(currentChapterHref)
  const currentChapterIdx = toc.findIndex(ch =>
    currentBase && ch.href && hrefBasename(ch.href) === currentBase
  )
  const currentChapterLabel = currentChapterIdx >= 0
    ? toc[currentChapterIdx].label?.trim()
    : null

  // Shared select style
  const selectStyle = {
    background: themeConfig.selectBg,
    color: themeConfig.selectText,
    border: `1px solid ${themeConfig.headerBtnBg}`,
  }

  return (
    <div className="relative h-full" style={{ background: themeConfig.readerBg }}>
      {/* Header with controls */}
      <div
        className="absolute top-0 left-0 right-0 text-white p-2 z-10 shadow-lg"
        style={{ background: themeConfig.headerBg }}
      >
        <div className="flex items-center justify-between gap-2 px-3">
          <h1 className="text-lg font-bold whitespace-nowrap">甄嬛传</h1>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Theme dropdown */}
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value)}
              className="px-2 py-1 rounded text-xs cursor-pointer"
              style={selectStyle}
            >
              {themeKeys.map(key => (
                <option key={key} value={key}>{themes[key].name}</option>
              ))}
            </select>

            {/* Font dropdown */}
            <select
              value={fontIndex}
              onChange={(e) => onFontChange(Number(e.target.value))}
              className="px-2 py-1 rounded text-xs cursor-pointer"
              style={selectStyle}
            >
              {fontOptions.map((f, i) => (
                <option key={i} value={i}>字体: {f.label}</option>
              ))}
            </select>

            {/* Font size controls: - 字体 + */}
            <span className="flex items-center rounded overflow-hidden" style={{ background: themeConfig.headerBtnBg }}>
              <button
                onClick={onDecreaseFontSize}
                className="px-2 py-1 text-sm hover:opacity-80 transition"
                title="缩小字体"
              >
                −
              </button>
              <span className="px-1 py-1 text-xs opacity-90">字号</span>
              <button
                onClick={onIncreaseFontSize}
                className="px-2 py-1 text-sm hover:opacity-80 transition"
                title="放大字体"
              >
                +
              </button>
            </span>

            <span className="text-xs opacity-80">
              {currentPage}/{totalPages}
            </span>

            <button
              onClick={prevPage}
              className="px-2 py-1 rounded transition text-sm"
              style={{ background: themeConfig.headerBtnBg }}
            >
              ←
            </button>
            <button
              onClick={nextPage}
              className="px-2 py-1 rounded transition text-sm"
              style={{ background: themeConfig.headerBtnBg }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* EPUB viewer */}
      <div
        ref={viewerRef}
        className="absolute top-12 left-0 right-0 bottom-12 overflow-hidden"
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
          <details className="w-full">
            <summary
              className="cursor-pointer px-4 py-2 text-sm grid items-center"
              style={{
                color: themeConfig.tocText,
                gridTemplateColumns: '1fr auto 1fr',
              }}
            >
              <span className="font-semibold truncate">
                📑 {currentChapterLabel || '目录'}
              </span>
              <span className="text-xs font-medium whitespace-nowrap">
                {currentChapterIdx >= 0 ? currentChapterIdx + 1 : '–'}/{toc.length}
              </span>
              <span className="text-xs opacity-70 whitespace-nowrap text-right">
                共{toc.length}章 · 进度{overallProgress}%
              </span>
            </summary>
            <div
              className="overflow-y-auto px-2 pb-2 grid gap-1"
              style={{
                maxHeight: '50vh',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              }}
            >
              {toc.map((chapter, index) => {
                const isActive = currentBase && chapter.href &&
                  hrefBasename(chapter.href) === currentBase
                return (
                  <button
                    key={index}
                    onClick={() => goToChapter(chapter.href)}
                    className="text-left px-3 py-2 text-sm rounded transition w-full"
                    style={{
                      background: isActive ? themeConfig.headerBg : themeConfig.tocBtnBg,
                      border: `1px solid ${isActive ? themeConfig.headerBg : themeConfig.tocBtnBorder}`,
                      color: isActive ? '#fff' : themeConfig.tocText,
                      fontWeight: isActive ? '600' : '400',
                    }}
                  >
                    {chapter.label}
                  </button>
                )
              })}
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
