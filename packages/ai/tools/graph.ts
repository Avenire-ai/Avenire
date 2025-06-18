import { tool } from "ai";
import { z } from "zod";

const graphSchema = z.object({
  expressions: z.array(
    z.object({
      id: z.string().describe("A unique identifier for each graph object."),
      latex: z.string().describe(
        `A LaTeX string representing the mathematical expression to be graphed. Follow LaTeX standards and Desmos API patterns:

      1. Basic Functions:
         - Linear: y = mx + b
         - Quadratic: y = ax^2 + bx + c
         - Cubic: y = ax^3 + bx^2 + cx + d
         - Exponential: y = a^x or y = e^x
         - Logarithmic: y = log_a(x) or y = ln(x)
         - Trigonometric: y = sin(x), y = cos(x), y = tan(x)
         - Inverse Trig: y = arcsin(x), y = arccos(x), y = arctan(x)

      2. Advanced Features:
         - Parametric: (x(t), y(t))
         - Polar: r = f(θ)
         - Implicit: f(x,y) = 0
         - Piecewise: y = {condition1: expr1, condition2: expr2}
         - Inequalities: y > f(x) or y < f(x)
         - Points: (x,y)
         - Lines: y = mx + b or ax + by = c
         - Circles: (x-h)^2 + (y-k)^2 = r^2
         - Ellipses: (x-h)^2/a^2 + (y-k)^2/b^2 = 1
         - Hyperbolas: (x-h)^2/a^2 - (y-k)^2/b^2 = 1

      3. Interactive Elements:
         - Always use these to make the graphs more interactive and fun to use.
         - Sliders: Use a=1, b=2, etc. for parameters
         - Points: Use (x,y) for draggable points
         - Segments: Use line segments between points
         - Regions: Use inequalities for shaded regions
         - Animations: Use t as a parameter for animations

      Examples:
      - Interactive parabola: y = ax^2 + bx + c with sliders for a, b, c
      - Parametric circle: (cos(t), sin(t))
      - Polar rose: r = a*sin(b*θ) with sliders for a, b
      - Piecewise function: y = {x < 0: -x, x >= 0: x^2}
      `
      ),
      lineStyle: z.enum(["solid", "dashed", "dotted", "thick", "thin"]).optional().describe("Sets the drawing style for line segments."),
      opacity: z.number().optional().describe("Opacity of the graph (0 to 1)."),
      sliderBounds: z
        .object({
          min: z.number().describe("Minimum value of the slider."),
          max: z.number().describe("Maximum value of the slider."),
          value: z.number().optional().describe("Current value of the slider."),
          step: z.number().optional().describe("Step size for the slider."),
          label: z.string().optional().describe("Label for the slider."),
          isPlaying: z.boolean().optional().describe("Whether the slider should animate."),
          playSpeed: z.number().optional().describe("Speed of animation (1 is normal speed).")
        })
        .optional()
        .describe("Defines slider behavior for dynamic variables."),
      domain: z
        .object({
          min: z.number().describe("Minimum x value to display."),
          max: z.number().describe("Maximum x value to display.")
        })
        .optional()
        .describe("Sets the visible domain of the graph."),
      range: z
        .object({
          min: z.number().describe("Minimum y value to display."),
          max: z.number().describe("Maximum y value to display.")
        })
        .optional()
        .describe("Sets the visible range of the graph."),
      label: z.string().optional().describe("Label for the graph expression."),
    })
  ),
});

export const graphTool = tool({
  description: "A tool for visualizing mathematical functions, equations, or expressions in LaTeX format. Always use this tool proactively whenever mathematical concepts can be better understood through visualization. The tool supports interactive elements like sliders, animations, and draggable points to help users explore mathematical concepts dynamically.",
  parameters: graphSchema,
  execute: async ({ expressions }) => {
    const exp = expressions.map(({ latex, sliderBounds, lineStyle, opacity, domain, range, label }) => ({
      latex,
      sliderBounds,
      lineStyle,
      opacity,
      domain,
      range,
      label,
    }))
    return { expressions: exp }
  }
});
