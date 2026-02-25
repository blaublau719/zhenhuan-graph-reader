import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function GraphVisualization({ graphData, currentChapter, readCharacters, detectedCharacters, themeConfig }) {
  const svgRef = useRef(null)
  const [selectedAlliance, setSelectedAlliance] = useState('all')
  const [showLabels, setShowLabels] = useState(true)

  // Persistent refs for incremental updates
  const simulationRef = useRef(null)
  const gRef = useRef(null)
  const linkGroupRef = useRef(null)
  const linkLabelGroupRef = useRef(null)
  const nodeGroupRef = useRef(null)
  const nodeLabelGroupRef = useRef(null)
  const currentNodesRef = useRef([])
  const currentEdgesRef = useRef([])
  const initializedRef = useRef(false)

  const allianceColors = {
    "皇室成员": "#ff6b6b",
    "皇后阵营": "#4ecdc4",
    "甄嬛阵营": "#95e1d3",
    "华妃阵营": "#f38181"
  }

  // One-time D3 scaffold setup
  useEffect(() => {
    if (!svgRef.current || initializedRef.current) return

    const container = svgRef.current.parentElement
    const width = container.clientWidth
    const height = container.clientHeight

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
    gRef.current = g

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    svg.call(zoom)

    linkGroupRef.current = g.append('g').attr('class', 'links')
    linkLabelGroupRef.current = g.append('g').attr('class', 'link-labels')
    nodeGroupRef.current = g.append('g').attr('class', 'nodes')
    nodeLabelGroupRef.current = g.append('g').attr('class', 'node-labels')

    const simulation = d3.forceSimulation([])
      .force('link', d3.forceLink([]).id(d => d.ID).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25))

    simulationRef.current = simulation
    initializedRef.current = true

    return () => {
      if (simulationRef.current) simulationRef.current.stop()
    }
  }, [])

  // Incremental node/edge update when readCharacters changes
  useEffect(() => {
    if (!initializedRef.current || !simulationRef.current) return

    const simulation = simulationRef.current
    const prevNodeIds = new Set(currentNodesRef.current.map(n => n.ID))

    const visibleNodes = graphData.nodes.filter(node =>
      readCharacters.has(node.Label)
    )
    const visibleNodeIds = new Set(visibleNodes.map(n => n.ID))
    const visibleEdges = graphData.edges.filter(edge => {
      const srcId = edge.source.ID !== undefined ? edge.source.ID : edge.source
      const tgtId = edge.target.ID !== undefined ? edge.target.ID : edge.target
      return visibleNodeIds.has(srcId) && visibleNodeIds.has(tgtId)
    })

    const newNodeIds = new Set(visibleNodes.map(n => n.ID))
    const hasNewNodes = visibleNodes.some(n => !prevNodeIds.has(n.ID))
    const hasRemovedNodes = currentNodesRef.current.some(n => !newNodeIds.has(n.ID))

    if (!hasNewNodes && !hasRemovedNodes && currentNodesRef.current.length > 0) return

    const positionMap = new Map()
    currentNodesRef.current.forEach(n => {
      positionMap.set(n.ID, { x: n.x, y: n.y, vx: n.vx, vy: n.vy })
    })

    const container = svgRef.current.parentElement
    const width = container.clientWidth
    const height = container.clientHeight

    const mergedNodes = visibleNodes.map(node => {
      const existing = positionMap.get(node.ID)
      if (existing) {
        return { ...node, x: existing.x, y: existing.y, vx: existing.vx, vy: existing.vy }
      }
      return { ...node, x: width / 2 + (Math.random() - 0.5) * 50, y: height / 2 + (Math.random() - 0.5) * 50 }
    })

    currentNodesRef.current = mergedNodes
    currentEdgesRef.current = visibleEdges.map(e => ({ ...e }))

    // Links
    const linkSel = linkGroupRef.current
      .selectAll('line')
      .data(currentEdgesRef.current, d => {
        const src = d.source.ID !== undefined ? d.source.ID : d.source
        const tgt = d.target.ID !== undefined ? d.target.ID : d.target
        return `${src}-${tgt}`
      })

    linkSel.exit().remove()

    const linkEnter = linkSel.enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)

    const link = linkEnter.merge(linkSel)

    // Link labels
    const linkLabelSel = linkLabelGroupRef.current
      .selectAll('text')
      .data(currentEdgesRef.current, d => {
        const src = d.source.ID !== undefined ? d.source.ID : d.source
        const tgt = d.target.ID !== undefined ? d.target.ID : d.target
        return `${src}-${tgt}`
      })

    linkLabelSel.exit().remove()

    const linkLabelEnter = linkLabelSel.enter().append('text')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text(d => d.Relationship)

    const linkLabel = linkLabelEnter.merge(linkLabelSel)
    linkLabel
      .attr('fill', themeConfig.linkLabelFill)
      .style('opacity', showLabels ? 1 : 0)

    // Nodes
    const nodeSel = nodeGroupRef.current
      .selectAll('circle')
      .data(currentNodesRef.current, d => d.ID)

    nodeSel.exit().remove()

    const nodeEnter = nodeSel.enter().append('circle')
      .attr('r', 10)
      .attr('fill', d => allianceColors[d.Alliance] || '#999')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }))
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke', '#ffd700').attr('stroke-width', 3)
        showTooltip(event, d)
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke', '#fff').attr('stroke-width', 2)
        hideTooltip()
      })

    const node = nodeEnter.merge(nodeSel)

    // Node labels
    const nodeLabelSel = nodeLabelGroupRef.current
      .selectAll('text')
      .data(currentNodesRef.current, d => d.ID)

    nodeLabelSel.exit().remove()

    const nodeLabelEnter = nodeLabelSel.enter().append('text')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .attr('dy', -15)
      .text(d => d.Label)

    const nodeLabel = nodeLabelEnter.merge(nodeLabelSel)
    nodeLabel
      .attr('fill', themeConfig.nodeLabelFill)
      .style('text-shadow', themeConfig.nodeLabelShadow)
      .style('opacity', showLabels ? 1 : 0)

    // Update simulation
    simulation.nodes(currentNodesRef.current)
    simulation.force('link').links(currentEdgesRef.current)

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      linkLabel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2)

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

      nodeLabel
        .attr('x', d => d.x)
        .attr('y', d => d.y)
    })

    simulation.alpha(0.3).restart()

  }, [graphData, readCharacters, showLabels, themeConfig])

  // Update label colors when theme changes (without restarting simulation)
  useEffect(() => {
    if (!nodeLabelGroupRef.current || !linkLabelGroupRef.current) return

    nodeLabelGroupRef.current.selectAll('text')
      .attr('fill', themeConfig.nodeLabelFill)
      .style('text-shadow', themeConfig.nodeLabelShadow)

    linkLabelGroupRef.current.selectAll('text')
      .attr('fill', themeConfig.linkLabelFill)
  }, [themeConfig])

  // Alliance filter (visual only)
  useEffect(() => {
    if (!nodeGroupRef.current) return

    if (selectedAlliance === 'all') {
      nodeGroupRef.current.selectAll('circle').style('opacity', 1)
      linkGroupRef.current.selectAll('line').style('opacity', 0.6)
      nodeLabelGroupRef.current.selectAll('text').style('opacity', showLabels ? 1 : 0)
    } else {
      nodeGroupRef.current.selectAll('circle')
        .style('opacity', d => d.Alliance === selectedAlliance ? 1 : 0.1)
      linkGroupRef.current.selectAll('line')
        .style('opacity', d => (d.source.Alliance === selectedAlliance || d.target.Alliance === selectedAlliance) ? 0.6 : 0.05)
      nodeLabelGroupRef.current.selectAll('text')
        .style('opacity', d => (d.Alliance === selectedAlliance && showLabels) ? 1 : 0)
    }
  }, [selectedAlliance, showLabels])

  const handleResetZoom = () => {
    const svg = d3.select(svgRef.current)
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        if (gRef.current) gRef.current.attr('transform', event.transform)
      })

    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity)
  }

  const showTooltip = (event, d) => {
    const tooltip = d3.select('#tooltip')
    tooltip.style('display', 'block')
      .html(`
        <div class="font-bold text-yellow-400 text-lg mb-2">${d.Label}</div>
        <div class="mb-1"><span class="font-semibold">职位：</span>${d.Title}</div>
        <div class="mb-1"><span class="font-semibold">阵营：</span>${d.Alliance}</div>
        <div class="mb-1"><span class="font-semibold">登场：</span>第${d.appearChapter}章</div>
      `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY + 10) + 'px')
      .style('background', themeConfig.tooltipBg)
      .style('color', themeConfig.tooltipText)
  }

  const hideTooltip = () => {
    d3.select('#tooltip').style('display', 'none')
  }

  return (
    <div
      className="relative w-full h-full"
      style={{ background: themeConfig.graphBg }}
    >
      <svg ref={svgRef} className="w-full h-full" />

      {/* Controls */}
      <div
        className="absolute top-5 left-5 p-4 rounded-lg shadow-lg z-10"
        style={{
          background: themeConfig.panelBg,
          color: themeConfig.panelText,
        }}
      >
        <h3 className="text-lg font-bold mb-3">控制面板</h3>

        <label className="block text-sm mb-1" style={{ color: themeConfig.legendText }}>阵营筛选：</label>
        <select
          value={selectedAlliance}
          onChange={(e) => setSelectedAlliance(e.target.value)}
          className="w-full mb-3 p-2 rounded text-sm"
          style={{
            background: themeConfig.tocBtnBg,
            border: `1px solid ${themeConfig.panelBorder}`,
            color: themeConfig.panelText,
          }}
        >
          <option value="all">全部</option>
          <option value="皇室成员">皇室成员</option>
          <option value="皇后阵营">皇后阵营</option>
          <option value="甄嬛阵营">甄嬛阵营</option>
          <option value="华妃阵营">华妃阵营</option>
        </select>

        <button
          onClick={handleResetZoom}
          className="w-full mb-2 px-4 py-2 text-white rounded transition text-sm"
          style={{ background: themeConfig.headerBg }}
        >
          重置视图
        </button>

        <button
          onClick={() => setShowLabels(!showLabels)}
          className="w-full px-4 py-2 text-white rounded transition text-sm"
          style={{ background: themeConfig.headerBg }}
        >
          {showLabels ? '隐藏标签' : '显示标签'}
        </button>

        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${themeConfig.panelBorder}` }}>
          <div className="text-sm mb-1" style={{ color: themeConfig.legendText }}>
            当前章节：<span className="font-bold" style={{ color: themeConfig.headerBg }}>第{currentChapter}章</span>
          </div>
          <div className="text-sm" style={{ color: themeConfig.legendText }}>
            已发现人物：<span className="font-bold text-green-600">{readCharacters.size}</span> / {graphData.nodes.length}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-5 left-5 p-4 rounded-lg shadow-lg z-10"
        style={{
          background: themeConfig.panelBg,
          color: themeConfig.panelText,
        }}
      >
        <h4 className="text-base font-bold mb-3">阵营图例</h4>
        {Object.entries(allianceColors).map(([alliance, color]) => (
          <div key={alliance} className="flex items-center mb-2">
            <div
              className="w-5 h-5 rounded-full mr-3 border-2 border-white"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm" style={{ color: themeConfig.legendText }}>{alliance}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      <div
        id="tooltip"
        className="fixed p-3 rounded-lg pointer-events-none shadow-lg z-50 max-w-xs"
        style={{
          display: 'none',
          background: themeConfig.tooltipBg,
          color: themeConfig.tooltipText,
        }}
      />
    </div>
  )
}
