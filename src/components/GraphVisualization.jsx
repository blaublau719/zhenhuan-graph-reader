import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function GraphVisualization({ graphData, currentChapter, readCharacters, detectedCharacters }) {
  const svgRef = useRef(null)
  const [selectedAlliance, setSelectedAlliance] = useState('all')
  const [showLabels, setShowLabels] = useState(true)
  const simulationRef = useRef(null)

  const allianceColors = {
    "皇室成员": "#ff6b6b",
    "皇后阵营": "#4ecdc4",
    "甄嬛阵营": "#95e1d3",
    "华妃阵营": "#f38181"
  }

  useEffect(() => {
    if (!svgRef.current) return

    const container = svgRef.current.parentElement
    const width = container.clientWidth
    const height = container.clientHeight

    // Filter nodes based on detected characters in text
    const visibleNodes = graphData.nodes.filter(node =>
      readCharacters.has(node.Label)
    )
    const visibleNodeIds = new Set(visibleNodes.map(n => n.ID))
    const visibleEdges = graphData.edges.filter(edge =>
      visibleNodeIds.has(edge.source.ID || edge.source) &&
      visibleNodeIds.has(edge.target.ID || edge.target)
    )

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Create force simulation
    const simulation = d3.forceSimulation(visibleNodes)
      .force('link', d3.forceLink(visibleEdges).id(d => d.ID).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25))

    simulationRef.current = simulation

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(visibleEdges)
      .enter().append('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)

    // Create link labels
    const linkLabel = g.append('g')
      .selectAll('text')
      .data(visibleEdges)
      .enter().append('text')
      .attr('class', 'link-label')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text(d => d.Relationship)
      .style('opacity', showLabels ? 1 : 0)

    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(visibleNodes)
      .enter().append('circle')
      .attr('class', 'node')
      .attr('r', 10)
      .attr('fill', d => allianceColors[d.Alliance] || '#999')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke', '#ffd700')
          .attr('stroke-width', 3)

        showTooltip(event, d)
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)

        hideTooltip()
      })

    // Create node labels
    const nodeLabel = g.append('g')
      .selectAll('text')
      .data(visibleNodes)
      .enter().append('text')
      .attr('class', 'node-label')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .attr('fill', '#333')
      .attr('dy', -15)
      .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)')
      .text(d => d.Label)
      .style('opacity', showLabels ? 1 : 0)

    // Update positions on each tick
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

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    // Apply alliance filter
    if (selectedAlliance !== 'all') {
      node.style('opacity', d => d.Alliance === selectedAlliance ? 1 : 0.1)
      link.style('opacity', d => {
        return (d.source.Alliance === selectedAlliance || d.target.Alliance === selectedAlliance) ? 0.6 : 0.05
      })
      nodeLabel.style('opacity', d => {
        return (d.Alliance === selectedAlliance && showLabels) ? 1 : 0
      })
    }

    // Cleanup
    return () => {
      if (simulation) simulation.stop()
    }

  }, [graphData, currentChapter, selectedAlliance, showLabels, readCharacters])

  const handleResetZoom = () => {
    const svg = d3.select(svgRef.current)
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        d3.select(svgRef.current).select('g').attr('transform', event.transform)
      })

    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity
    )
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
  }

  const hideTooltip = () => {
    d3.select('#tooltip').style('display', 'none')
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-amber-200 to-yellow-300">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Controls */}
      <div className="absolute top-5 left-5 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg z-10">
        <h3 className="text-lg font-bold text-gray-800 mb-3">控制面板</h3>

        <label className="block text-sm text-gray-700 mb-1">阵营筛选：</label>
        <select
          value={selectedAlliance}
          onChange={(e) => setSelectedAlliance(e.target.value)}
          className="w-full mb-3 p-2 border border-gray-300 rounded text-sm"
        >
          <option value="all">全部</option>
          <option value="皇室成员">皇室成员</option>
          <option value="皇后阵营">皇后阵营</option>
          <option value="甄嬛阵营">甄嬛阵营</option>
          <option value="华妃阵营">华妃阵营</option>
        </select>

        <button
          onClick={handleResetZoom}
          className="w-full mb-2 px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800 transition text-sm"
        >
          重置视图
        </button>

        <button
          onClick={() => setShowLabels(!showLabels)}
          className="w-full px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800 transition text-sm"
        >
          {showLabels ? '隐藏标签' : '显示标签'}
        </button>

        <div className="mt-3 pt-3 border-t border-gray-300">
          <div className="text-sm text-gray-600 mb-1">
            当前章节：<span className="font-bold text-amber-700">第{currentChapter}章</span>
          </div>
          <div className="text-sm text-gray-600">
            已发现人物：<span className="font-bold text-green-600">{readCharacters.size}</span> / {graphData.nodes.length}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-5 left-5 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg z-10">
        <h4 className="text-base font-bold text-gray-800 mb-3">阵营图例</h4>
        {Object.entries(allianceColors).map(([alliance, color]) => (
          <div key={alliance} className="flex items-center mb-2">
            <div
              className="w-5 h-5 rounded-full mr-3 border-2 border-white"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-700">{alliance}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      <div
        id="tooltip"
        className="fixed bg-black bg-opacity-90 text-white p-3 rounded-lg pointer-events-none shadow-lg z-50 max-w-xs"
        style={{ display: 'none' }}
      />
    </div>
  )
}
