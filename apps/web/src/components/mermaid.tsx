'use client';

import type React from "react"
import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@avenire/ui/src/components/button';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Download, Move, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@avenire/ui/components/card"

import { useTheme } from 'next-themes';


interface InteractiveMermaidChartProps {
  chart: string
  onRetry?: () => void;
  title?: string
  className?: string
  containerHeight?: number
  containerWidth?: number
}

interface ViewState {
  scale: number
  translateX: number
  translateY: number
}

export function MermaidDiagram({
  chart,
  title,
  className = "",
  containerHeight = 500,
  containerWidth = 800,
}: InteractiveMermaidChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewState, setViewState] = useState<ViewState>({ scale: 1, translateX: 0, translateY: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isDownloading, setIsDownloading] = useState(false)
  const { theme } = useTheme()

  const renderChart = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const mermaid = (await import("mermaid")).default

      // Light theme based on provided CSS variables
      const lightMermaidTheme = {
        theme: "base",
        themeVariables: {
          background: "#ffffff",
          primaryColor: "#8ca0b9",
          primaryTextColor: "#000000",
          primaryBorderColor: "#8ca0b9",
          secondaryColor: "#f0f0f0",
          secondaryTextColor: "#343434",
          tertiaryColor: "#f0f0f0",
          tertiaryTextColor: "#8e8e8e",

          // General diagram colors
          lineColor: "#8ca0b9",
          textColor: "#252525",

          // Flowchart specific
          nodeBorder: "#e0e0e0",
          nodeTextColor: "#252525",
          clusterBkg: "#f0f0f0",
          clusterBorder: "#e0e0e0",

          // Sequence diagram specific
          actorBorder: "#8ca0b9",
          actorBkg: "#f0f0f0",
          actorTextColor: "#252525",
          signalColor: "#8ca0b9",
          signalTextColor: "#252525",
          labelBoxBkgColor: "#f0f0f0",
          labelBoxBorderColor: "#e0e0e0",
          loopTextColor: "#252525",
          loopBorderColor: "#8e8e8e",

          // Note colors
          noteBkgColor: "#f0f0f0",
          noteBorderColor: "#e0e0e0",
          noteTextColor: "#252525",

          // State diagram specific
          stateLineColor: "#8ca0b9",
          stateText: "#252525",
          stateBkg: "#f0f0f0",

          // Error colors
          errorBkgColor: "#c75f5f",
          errorTextColor: "#ffffff",

          // Pie chart colors
          pie1: "#d1a0a1",
          pie2: "#b8a8c9",
          pie3: "#c29a94",
          pie4: "#a8aabf",
          pie5: "#b69a90",

          // Gantt chart specific
          sectionBkgColor: "#f0f0f0",
          altSectionBkgColor: "#ffffff",
          taskBorderColor: "#e0e0e0",
          taskBkgColor: "#8ca0b9",
          taskTextClickableColor: "#000000",

          // Font settings
          fontFamily: "Geist, sans-serif",
          fontSize: "14px",
        },
      }

      // Dark theme based on provided CSS variables
      const darkMermaidTheme = {
        theme: "base",
        themeVariables: {
          background: "#070707",
          primaryColor: "#637797",
          primaryTextColor: "#000000",
          primaryBorderColor: "#637797",
          secondaryColor: "#282829",
          secondaryTextColor: "#fafafa",
          tertiaryColor: "#292929",
          tertiaryTextColor: "#a3a3a8",

          // General diagram colors
          lineColor: "#637797",
          textColor: "#fafafa",

          // Flowchart specific
          nodeBorder: "#0e0e0e",
          nodeTextColor: "#fafafa",
          clusterBkg: "#0d0d0d",
          clusterBorder: "#0e0e0e",

          // Sequence diagram specific
          actorBorder: "#637797",
          actorBkg: "#282829",
          actorTextColor: "#fafafa",
          signalColor: "#637797",
          signalTextColor: "#fafafa",
          labelBoxBkgColor: "#0d0d0d",
          labelBoxBorderColor: "#0e0e0e",
          loopTextColor: "#fafafa",
          loopBorderColor: "#a3a3a8",

          // Note colors
          noteBkgColor: "#0d0d0d",
          noteBorderColor: "#0e0e0e",
          noteTextColor: "#fafafa",

          // State diagram specific
          stateLineColor: "#637797",
          stateText: "#fafafa",
          stateBkg: "#282829",

          // Error colors
          errorBkgColor: "#6b3131",
          errorTextColor: "#fcf5f5",

          // Pie chart colors
          pie1: "#c58b8c",
          pie2: "#ac9ec6",
          pie3: "#b87c73",
          pie4: "#9598c0",
          pie5: "#a77669",

          // Gantt chart specific
          sectionBkgColor: "#282829",
          altSectionBkgColor: "#070707",
          taskBorderColor: "#0e0e0e",
          taskBkgColor: "#637797",
          taskTextClickableColor: "#000000",

          // Font settings
          fontFamily: "Geist, sans-serif",
          fontSize: "14px",
        },
      }

      // Select theme based on current app theme
      const selectedTheme = theme === "dark" ? darkMermaidTheme : lightMermaidTheme

      //@ts-expect-error
      mermaid.initialize({
        startOnLoad: false,
        suppressErrorRendering: true,
        securityLevel: "loose",
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: "basis",
        },
        sequence: {
          useMaxWidth: false,
          wrap: true,
        },
        gantt: {
          useMaxWidth: false,
        },
        ...selectedTheme,
      })

      if (chartRef.current) {
        chartRef.current.innerHTML = ""
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`

        // Validate chart syntax before rendering
        try {
          const { svg } = await mermaid.render(id, chart)

          // Check if the SVG contains error indicators
          chartRef.current.innerHTML = svg

          // Auto-fit chart on initial render
          setTimeout(() => fitToScreen(), 100)
        } catch (renderError) {
          // Clear any partial render
          chartRef.current.innerHTML = ""
          throw new Error("Please check your Mermaid syntax")
        }
      }
    } catch (err) {
      console.error("Mermaid rendering error:", err)
      setError("Invalid chart syntax. Please check your Mermaid code.")

      // Clear the chart container to prevent showing ugly default errors
      if (chartRef.current) {
        chartRef.current.innerHTML = ""
      }
    } finally {
      setIsLoading(false)
    }
  }, [chart, theme])

  useEffect(() => {
    if (chart) {
      renderChart()
    }
  }, [chart, renderChart])

  // Re-render chart when theme changes
  useEffect(() => {
    renderChart()
  }, [theme, renderChart])

  const handleZoomIn = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const newScale = Math.min(viewState.scale * 1.2, 5)

      // Calculate the point in the chart that's at the center
      const pointX = (centerX - viewState.translateX) / viewState.scale
      const pointY = (centerY - viewState.translateY) / viewState.scale

      // Calculate new translation to keep the center point centered
      const newTranslateX = centerX - pointX * newScale
      const newTranslateY = centerY - pointY * newScale

      setViewState({
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      })
    }

  }

  const handleZoomOut = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const newScale = Math.max(viewState.scale / 1.2, 0.1)

      // Calculate the point in the chart that's at the center
      const pointX = (centerX - viewState.translateX) / viewState.scale
      const pointY = (centerY - viewState.translateY) / viewState.scale

      // Calculate new translation to keep the center point centered
      const newTranslateX = centerX - pointX * newScale
      const newTranslateY = centerY - pointY * newScale

      setViewState({
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      })
    }

  }

  const handleReset = () => {
    setViewState({ scale: 1, translateX: 0, translateY: 0 })
  }

  const fitToScreen = () => {
    if (chartRef.current && containerRef.current) {
      const svgElement = chartRef.current.querySelector("svg")
      if (svgElement) {
        const svgRect = svgElement.getBoundingClientRect()
        const containerRect = containerRef.current.getBoundingClientRect()

        const scaleX = (containerRect.width - 40) / svgRect.width
        const scaleY = (containerRect.height - 40) / svgRect.height
        const scale = Math.min(scaleX, scaleY, 1)

        const translateX = (containerRect.width - svgRect.width * scale) / 2
        const translateY = (containerRect.height - svgRect.height * scale) / 2

        setViewState({ scale, translateX, translateY })
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - viewState.translateX, y: e.clientY - viewState.translateY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      setViewState((prev) => ({
        ...prev,
        translateX: e.clientX - dragStart.x,
        translateY: e.clientY - dragStart.y,
      }))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.min(Math.max(viewState.scale * delta, 0.1), 5)

      // Calculate the point in the chart that's under the cursor
      const pointX = (cursorX - viewState.translateX) / viewState.scale
      const pointY = (cursorY - viewState.translateY) / viewState.scale

      // Calculate new translation to keep the point under the cursor
      const newTranslateX = cursorX - pointX * newScale
      const newTranslateY = cursorY - pointY * newScale

      setViewState({
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      })
    }

  }

  const downloadChart = async () => {
    if (chartRef.current && !isDownloading) {

      try {
        setIsDownloading(true)
        const svgElement = chartRef.current.querySelector("svg")
        if (!svgElement) return

        // Clone the SVG to avoid modifying the original
        const svgClone = svgElement.cloneNode(true) as SVGElement

        // Get SVG dimensions
        const svgRect = svgElement.getBoundingClientRect()
        const width = svgRect.width
        const height = svgRect.height

        // Create canvas
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size with higher resolution for better quality
        const scale = 2
        canvas.width = width * scale
        canvas.height = height * scale
        ctx.scale(scale, scale)

        // Convert SVG to data URL
        const svgData = new XMLSerializer().serializeToString(svgClone)
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
        const svgUrl = URL.createObjectURL(svgBlob)

        // Create image and draw to canvas
        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          // Fill background based on theme
          ctx.fillStyle = theme === "dark" ? "#070707" : "#ffffff"
          ctx.fillRect(0, 0, width, height)

          // Draw the SVG
          ctx.drawImage(img, 0, 0, width, height)

          // Download the image
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `mermaid-chart-${Date.now()}.png`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }
          }, "image/png")

          URL.revokeObjectURL(svgUrl)
          setIsDownloading(false)
        }

        img.onerror = () => {
          console.error("Failed to load SVG for download")
          setIsDownloading(false)
        }

        img.src = svgUrl
      } catch (err) {
        console.error("Download failed:", err)
        setIsDownloading(false)
      }
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const rect = container.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.min(Math.max(viewState.scale * delta, 0.1), 5)

      // Calculate the point in the chart that's under the cursor
      const pointX = (cursorX - viewState.translateX) / viewState.scale
      const pointY = (cursorY - viewState.translateY) / viewState.scale

      // Calculate new translation to keep the point under the cursor
      const newTranslateX = cursorX - pointX * newScale
      const newTranslateY = cursorY - pointY * newScale

      setViewState({
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      })
    }

    container.addEventListener("wheel", handleWheelEvent, { passive: false })

    return () => {
      container.removeEventListener("wheel", handleWheelEvent)
    }
  }, [viewState.scale, viewState.translateX, viewState.translateY])

  return (
    <Card className={`w-full ${className}`}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-center">{title}</CardTitle>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {/* Chart Container */}
        <div
          ref={containerRef}
          className="relative overflow-hidden bg-background select-none"
          style={{
            height: containerHeight,
            width: "100%",
            maxWidth: containerWidth,
            margin: "0 auto",
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Rendering chart...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="text-center p-6">
                <div className="text-muted-foreground text-sm mb-3">⚠️ Chart Error</div>
                <p className="text-destructive text-sm mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={renderChart}>
                  Try Again
                </Button>
              </div>
            </div>
          )}

          <div
            ref={chartRef}
            className={`mermaid-chart transition-transform select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"} ${isLoading ? "opacity-0" : "opacity-100"}`}
            style={{
              transform: `translate(${viewState.translateX}px, ${viewState.translateY}px) scale(${viewState.scale})`,
              transformOrigin: "0 0",
              transition: isDragging ? "none" : "transform 0.2s ease-out",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
          />

          {/* Pan hint */}
          {!isLoading && !error && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg border">
              <Move className="h-3 w-3" />
              <span>Drag to pan • Scroll to zoom</span>
            </div>
          )}
          {/* Floating Controls - Clustered Layout */}
          <div className="absolute bottom-4 right-4 z-20">
            <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border p-1">
              <div className="grid grid-cols-3 gap-1">
                {/* Top row */}
                <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" onClick={fitToScreen} className="h-8 w-8">
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
                  <ZoomOut className="h-3 w-3" />
                </Button>

                {/* Middle row */}
                <div className="h-8 w-8 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {Math.round(viewState.scale * 100)}%
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleReset} className="h-8 w-8">
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={downloadChart}
                  disabled={isDownloading || isLoading}
                  className="h-8 w-8"
                >
                  {isDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
