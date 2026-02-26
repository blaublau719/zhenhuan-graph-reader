/**
 * Event replay engine for dynamic graph state.
 *
 * Given a base graphData and an event-chapter number (1–31),
 * replays all events up to that chapter and returns:
 *   - nodes with current Titles
 *   - edges with dynamic Relationships overlaid on base edges
 *   - currentEvents: list of events for the current chapter only
 */
import rawEvents from './zhenhuan_complete_events.json'

// ---------- Name alias: events JSON name → graphData Label ----------
export const NAME_ALIAS = {
  // 皇帝
  '玄凌': '雍正',
  '皇上': '雍正',
  // 皇后
  '皇后': '宜修',
  // 华妃阵营
  '华妃': '年世兰',
  '年妃': '年世兰',
  '华贵妃': '年世兰',
  '年答应': '年世兰',
  '年贵嫔': '年世兰',
  // 果郡王
  '果郡王': '允礼',
  '果亲王': '允礼',
  '十七爷': '允礼',
  // 崔槿汐
  '槿汐': '崔槿汐',
  '槿汐姑姑': '崔槿汐',
  // 甄嬛
  '莞嫔': '甄嬛',
  '莞贵人': '甄嬛',
  '莞常在': '甄嬛',
  '莞妃': '甄嬛',
  '熹贵妃': '甄嬛',
  '熹妃': '甄嬛',
  // 沈眉庄
  '眉庄': '沈眉庄',
  '惠贵人': '沈眉庄',
  '惠嫔': '沈眉庄',
  '眉姐姐': '沈眉庄',
  // 安陵容
  '安答应': '安陵容',
  '安常在': '安陵容',
  '安贵人': '安陵容',
  '安嫔': '安陵容',
  '鹂妃': '安陵容',
  // 方淳意
  '淳常在': '方淳意',
  '淳贵人': '方淳意',
  '淳儿': '方淳意',
  // 曹琴默
  '曹容华': '曹琴默',
  '曹贵人': '曹琴默',
  '襄嫔': '曹琴默',
  // 余莺儿
  '余更衣': '余莺儿',
  '余答应': '余莺儿',
  // 瓜尔佳文鸳
  '欣贵人': '瓜尔佳文鸳',
  '欣常在': '瓜尔佳文鸳',
  '文鸳': '瓜尔佳文鸳',
  // 费云烟
  '丽嫔': '费云烟',
  '丽贵嫔': '费云烟',
  // 汤静言
  '贤妃': '汤静言',
  '静言': '汤静言',
  // 叶澜依
  '澜依': '叶澜依',
  '宁嫔': '叶澜依',
  // 吕盈风
  '贞嫔': '吕盈风',
  '盈风': '吕盈风',
  // 冯若昭
  '德妃': '冯若昭',
  '若昭': '冯若昭',
  // 齐月宾
  '端妃': '齐月宾',
  '月宾': '齐月宾',
  // 颂芝
  '颂芝小主': '颂芝',
  // 浣碧
  '玉隐': '浣碧',
  // 甄玉饶
  '玉饶': '甄玉饶',
  // 慎郡王
  '慎郡王': '允禧',
  // 孟静娴
  '静娴': '孟静娴',
  // 温实初
  '温太医': '温实初',
  '实初': '温实初',
  // 苏培盛
  '培盛': '苏培盛',
}

function resolveLabel(name) {
  return NAME_ALIAS[name] || name
}

// Sort events by chapter (stable)
const sortedEvents = [...rawEvents].sort((a, b) => a.chapter - b.chapter)

// Max event chapter
export const MAX_EVENT_CHAPTER = Math.max(...rawEvents.map(e => e.chapter))

/**
 * Map a TOC index (0-based, out of totalTocItems) to an event chapter (1–31).
 * Uses linear proportional mapping.
 */
export function tocIndexToEventChapter(tocIndex, totalTocItems) {
  if (totalTocItems <= 0 || tocIndex < 0) return 0
  const ratio = (tocIndex + 1) / totalTocItems
  return Math.min(MAX_EVENT_CHAPTER, Math.max(1, Math.ceil(ratio * MAX_EVENT_CHAPTER)))
}

/**
 * Compute graph state at a given event chapter.
 *
 * @param {object} baseGraphData - { nodes: [...], edges: [...] } from graphData.js
 * @param {number} eventChapter - 1–31 (0 = before any events)
 * @returns {{ nodes, edges, currentEvents }}
 */
export function computeGraphState(baseGraphData, eventChapter) {
  // Build label → node ID map for resolving relationship events
  const labelToId = new Map()
  baseGraphData.nodes.forEach(n => {
    labelToId.set(n.Label, n.ID)
  })

  // Start with initialTitle for all nodes
  const titleMap = new Map() // nodeLabel → current title
  baseGraphData.nodes.forEach(n => {
    titleMap.set(n.Label, n.initialTitle || '')
  })

  // Dynamic relationship edges: key "srcId-tgtId" → { source, target, Relationship, event }
  const dynamicEdges = new Map()

  // Events for the exact current chapter
  const currentEvents = []

  // Replay all events up to eventChapter
  sortedEvents.forEach(event => {
    if (event.chapter > eventChapter) return

    if (event.type === 'status_change') {
      const label = resolveLabel(event.character)
      if (titleMap.has(label)) {
        titleMap.set(label, event.title)
      }
    } else if (event.type === 'relationship') {
      const [char1, char2] = event.characters
      const label1 = resolveLabel(char1)
      const label2 = resolveLabel(char2)
      const id1 = labelToId.get(label1)
      const id2 = labelToId.get(label2)
      if (id1 !== undefined && id2 !== undefined) {
        // Use sorted key so same pair always maps to same entry
        const key = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`
        dynamicEdges.set(key, {
          source: id1 < id2 ? id1 : id2,
          target: id1 < id2 ? id2 : id1,
          Relationship: event.relationship,
        })
      }
    }

    if (event.chapter === eventChapter) {
      currentEvents.push(event)
    }
  })

  // Build final nodes with dynamic titles
  const nodes = baseGraphData.nodes.map(n => ({
    ...n,
    Title: titleMap.get(n.Label) || n.initialTitle || '',
  }))

  // Merge base edges with dynamic edges
  // Base edges are kept; if a dynamic edge exists for the same pair, override Relationship
  const baseEdgeMap = new Map()
  baseGraphData.edges.forEach(e => {
    const srcId = typeof e.source === 'object' ? e.source.ID : e.source
    const tgtId = typeof e.target === 'object' ? e.target.ID : e.target
    const key = srcId < tgtId ? `${srcId}-${tgtId}` : `${tgtId}-${srcId}`
    baseEdgeMap.set(key, {
      source: srcId < tgtId ? srcId : tgtId,
      target: srcId < tgtId ? tgtId : srcId,
      Relationship: e.Relationship,
    })
  })

  // Overlay dynamic edges onto base edges
  dynamicEdges.forEach((dynEdge, key) => {
    if (baseEdgeMap.has(key)) {
      // Override relationship label on existing base edge
      baseEdgeMap.get(key).Relationship = dynEdge.Relationship
    } else {
      // New dynamic edge not in base
      baseEdgeMap.set(key, dynEdge)
    }
  })

  const edges = Array.from(baseEdgeMap.values())

  return { nodes, edges, currentEvents }
}
