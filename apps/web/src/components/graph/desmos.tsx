"use client";

import { useRef, useEffect, useState } from "react";
import { GraphingCalculator } from "desmos-react";
import 'katex/dist/katex.min.css';
import { useTheme } from "next-themes";
import { useGraphStore } from "../../stores/graphStore";
import { ImageGallery } from "@avenire/ui/components/image-gallery";

const useCalculatorHook = (theme: string) => {
  const graphRef = useRef<Desmos.Calculator>(null)
  const [originalStrokeFunction, setOriginalStrokeFunction] = useState<any | undefined>(undefined)

  useEffect(() => {
    if (originalStrokeFunction) {
      if (theme === "dark") {
        darkTheme(originalStrokeFunction)
      } else {
        lightTheme(originalStrokeFunction)
      }
    }
  }, [theme])

  const init = () => {
    if (graphRef.current !== undefined) {
      //@ts-expect-error
      const originalCtx = graphRef.current.controller.grapher2d.canvasLayer.ctx as CanvasRenderingContext2D;
      const render = originalCtx.stroke.bind(originalCtx)
      setOriginalStrokeFunction({ render })
      if (theme === "dark") {
        darkTheme({
          render
        })
      } else {
        lightTheme({
          render
        })
      }
    }
  }

  const darkTheme = (osf: any) => {
    graphRef.current?.updateSettings({
      //@ts-expect-error
      backgroundColor: "#101010",
      settingsMenu: false,
      textColor: "#F9F8FC"
    })
    const gridLinesColor = (opacity: number) => `rgba(237, 237, 237, ${opacity})`;

    // @ts-expect-error
    const ctx = graphRef.current?.controller.grapher2d.canvasLayer.ctx as CanvasRenderingContext2D;

    ctx.stroke = () => {
      if (!osf) { return }
      const currentStrokeStyle = ctx.strokeStyle;
      const currentStrokeStyleString = currentStrokeStyle.toString();
      if (currentStrokeStyleString.startsWith("rgba(0, 0, 0")) {
        const opacity = currentStrokeStyleString.split(", ")[3].replace(/\)/g, "");
        ctx.strokeStyle = gridLinesColor(Number.parseFloat(opacity));
      }
      osf.render();
      ctx.strokeStyle = currentStrokeStyle;
    };
  }

  const lightTheme = (osf: any) => {
    graphRef.current?.updateSettings({
      //@ts-expect-error
      backgroundColor: "#fff",
      settingsMenu: false,
      textColor: "#000"
    })
    // @ts-expect-error
    const ctx = graphRef.current?.controller.grapher2d.canvasLayer.ctx as CanvasRenderingContext2D;

    ctx.stroke = () => {
      if (!osf) { return }
      osf.render();
    };
  }

  return { graphRef, darkTheme, lightTheme, init }
}

export function GraphImage({ expressions }: { expressions: Desmos.ExpressionState[] }) {
  const { theme } = useTheme()
  const { graphRef } = useCalculatorHook(theme || "dark")
  const [images, setImages] = useState<Array<{
    src: string,
    alt: string
  }>>([])

  useEffect(() => {
    const captureImages = async () => {
      const screenshots = await Promise.all(
        expressions.map((expression) => {
          return new Promise<{ src: string, alt: string }>((resolve) => {
            graphRef.current?.setBlank();
            graphRef.current?.setExpressions([expression]);
            graphRef.current?.asyncScreenshot(
              {
                height: 600,
                width: 600,
                mode: "contain",
              },
              (image) => resolve({ src: image, alt: (expression as any).latex })
            );
          });
        })
      );
      setImages(screenshots);
    };
    captureImages();
  }, [expressions])

  return (
    <>
      <div className="hidden">
        <GraphingCalculator
          ref={graphRef}
          fontSize={18}
          attributes={{
            className: "desmos",
            style: { height: "400px", width: "600px" },
          }}
          keypad
        />
      </div>
      <div className="w-1/3 h-1/3">
        <ImageGallery images={images} />
      </div>
    </>
  );
}

export function GraphComp() {
  const { theme } = useTheme()
  const { graphRef, init } = useCalculatorHook(theme || "dark")
  const { setGraphRef } = useGraphStore()

  useEffect(() => {
    setGraphRef(graphRef)
    init()
  }, [graphRef])

  return (
    <GraphingCalculator
      ref={graphRef}
      fontSize={18}
      attributes={{
        className: "desmos",
        style: { height: "inherit", width: "inherit" },
      }}
      keypad
    />
  );
} 