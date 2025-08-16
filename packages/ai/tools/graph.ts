import { tool } from "ai";
import { z } from "zod";

const graphSchema = z.object({
  expressions: z.array(
    z.object({
      id: z.string().describe("A unique identifier for each graph object."),
      latex: z.string().describe(
        `A LaTeX string representing the mathematical expression to be graphed. Use Desmos-compatible LaTeX syntax:

      CRITICAL: Always prioritize interactivity! Use sliders and dynamic elements to make graphs engaging and educational.
      ALWAYS use a backslash (\\) for square roots (\\sqrt{}), trigonometric functions (\\sin, \\cos, etc.), and all other functions as required by Desmos LaTeX syntax.

      For simple coordinate geometry, calculus, polynomials, and algebra, ALWAYS use BOTH this tool (for interactive/educational plots) AND the plotTool (for static/advanced plots).

      BASIC SYNTAX RULES (Desmos API v1.11):
      - Use ^ for exponents: x^2, x^{3}
      - Use * for multiplication: 2*x, a*b
      - Use / for division: x/2, a/b
      - Use \\sqrt() for square roots: \\sqrt(x), \\sqrt(x^2 + y^2)
      - Use nthroot(n,x) for nth roots: nthroot(3,x)
      - Use \\log(x) for natural log, \\log_{a}(x) for log base a
      - Use \\sin(x), \\cos(x), \\tan(x), \\csc(x), \\sec(x), \\cot(x)
      - Use \\arcsin(x), \\arccos(x), \\arctan(x) for inverse trig
      - Use pi for π, e for Euler's number
      - Use infinity for ∞
      - Use theta for θ in polar coordinates

      INTERACTIVE ELEMENTS (PRIORITIZE THESE):
      1. SLIDERS - Use single letters as parameters: a, b, c, d, etc.
         Examples: y = a*x^2 + b*x + c, r = a*\\sin(b*theta)
         IMPORTANT: Configure slider bounds in the sliderBounds property, NOT in LaTeX
         The LaTeX should only contain the parameter names (a, b, c, etc.)
         CRITICAL: For every arbitrary variable used (a, b, c, etc.), create a separate expression for that variable
         Example: If using y = a*x^2 + b*x + c, also create expressions for "a = 1", "b = 2", "c = 3"
      
      2. ANIMATIONS - Use t as parameter: (\\cos(t), \\sin(t)), r = t*\\sin(theta)
         Enable animation with isPlaying: true and playSpeed: 1 in sliderBounds
      
      3. DRAGGABLE POINTS - Use (x,y) format: (a,b), (\\cos(t), \\sin(t))
      
      4. DYNAMIC RANGES - Use expressions in bounds: x = [a, b], y = [c, d]

      FUNCTION TYPES (Desmos API Supported):
      1. EXPLICIT: y = f(x)
         - Linear: y = m*x + b
         - Quadratic: y = a*x^2 + b*x + c
         - Cubic: y = a*x^3 + b*x^2 + c*x + d
         - Exponential: y = a^x, y = e^x, y = a*e^{b*x}
         - Logarithmic: y = \\log(x), y = \\log_{a}(x)
         - Trigonometric: y = a*\\sin(b*x + c), y = a*\\cos(b*x + c)
         - Rational: y = (a*x + b)/(c*x + d)
         - Power: y = x^a, y = a*x^b
         - Absolute value: y = |x|, y = |a*x + b|

      2. PARAMETRIC: (x(t), y(t)) - Use single expression with comma-separated coordinates
         - Circle: (r*\\cos(t), r*\\sin(t))
         - Ellipse: (a*\\cos(t), b*\\sin(t))
         - Spiral: (t*\\cos(t), t*\\sin(t))
         - Lissajous: (a*\\sin(b*t), c*\\sin(d*t))
         - Cardioid: (a*(1-\\cos(t))*\\cos(t), a*(1-\\cos(t))*\\sin(t))
         - IMPORTANT: For parametric equations, use ONE expression with (x(t), y(t)) format
         - DO NOT split into separate x = ... and y = ... expressions

      3. POLAR: r = f(theta)
         - Circle: r = a
         - Rose: r = a*\\sin(b*theta), r = a*\\cos(b*theta)
         - Cardioid: r = a*(1 + \\cos(theta))
         - Limacon: r = a + b*\\cos(theta)
         - Spiral: r = a*theta
         - Lemniscate: r^2 = a^2*\\cos(2*theta)

      4. IMPLICIT: f(x,y) = 0
         - Circle: (x-a)^2 + (y-b)^2 = r^2
         - Ellipse: (x-a)^2/c^2 + (y-b)^2/d^2 = 1
         - Hyperbola: (x-a)^2/c^2 - (y-b)^2/d^2 = 1
         - Parabola: y = a*(x-b)^2 + c
         - Line: a*x + b*y = c

      5. PIECEWISE: Use curly braces
         - y = {x < 0: -x, x >= 0: x^2}
         - y = {x < a: b*x, x >= a: c*x^2}
         - y = {x < -1: -1, -1 <= x <= 1: x, x > 1: 1}

      6. INEQUALITIES: Use >, <, >=, <=
         - y > x^2
         - x^2 + y^2 <= r^2
         - y >= a*x + b
         - |x| + |y| <= a

      INTERACTIVITY EXAMPLES:
      - Interactive parabola: y = a*x^2 + b*x + c (configure a,b,c sliders in sliderBounds)
      - Animated circle: (r*\\cos(t), r*\\sin(t)) (configure r slider in sliderBounds)
      - Dynamic rose: r = a*\\sin(b*theta) (configure a,b sliders in sliderBounds)
      - Interactive piecewise: y = {x < a: b*x, x >= a: c*x^2} (configure a,b,c sliders in sliderBounds)
      - Animated spiral: r = t*\\sin(theta) (configure t animation in sliderBounds)
      - Dynamic ellipse: (a*\\cos(t), b*\\sin(t)) (configure a,b sliders in sliderBounds)
      - Interactive absolute value: y = a*|x - b| + c (configure a,b,c sliders in sliderBounds)
      - Polynomial exploration: y = a*x^3 + b*x^2 + c*x + d (configure a,b,c,d sliders in sliderBounds)
      - Trigonometric functions: y = a*\\sin(b*x + c) + d (configure a,b,c,d sliders in sliderBounds)
      - Derivative exploration: y = f(x) and y = f'(x) with sliders for function parameters
      - Integral visualization: y = f(x) with shaded area and slider for integration bounds
      - Coordinate geometry: y = mx + b with sliders for slope (m) and y-intercept (b)
      - Algebraic functions: y = \\sqrt(ax + b) with sliders for a,b parameters

      CORRECT PARAMETRIC EXAMPLES:
      - Animated circle: (r*\\cos(t), r*\\sin(t)) where r is a slider
      - Dynamic ellipse: (a*\\cos(t), b*\\sin(t)) where a,b are sliders
      - Spiral: (t*\\cos(t), t*\\sin(t)) where t animates
      - Lissajous: (a*\\sin(b*t), c*\\sin(d*t)) where a,b,c,d are sliders

      ALWAYS INCLUDE:
      1. Sliders for coefficients (a, b, c, etc.) with proper bounds in sliderBounds
      2. Appropriate domains and ranges for visibility
      3. Multiple expressions to show relationships
      4. Interactive elements that demonstrate concepts
      5. Clear labels and descriptions
      6. Animation parameters when appropriate
      7. For coordinate geometry, calculus, polynomials, and algebra: ALWAYS use interactive sliders and draggable points

      AVOID:
      - Complex nested functions that may not render properly
      - Non-standard mathematical notation
      - Static graphs without interactive elements
      - Overly complex expressions that confuse users
      - Missing slider bounds or inappropriate ranges
      - Putting slider bounds in LaTeX expressions (use sliderBounds property)
      - For coordinate geometry, calculus, polynomials, and algebra: avoid static-only visualizations
      - Splitting parametric equations into separate x = ... and y = ... expressions
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
        .describe(`
       SLIDER BOUNDS CONFIGURATION (Only use when the current expression is a slider like "a = 12" where a is an arbitrary number):
       IMPORTANT: For every arbitrary variable (a, b, c, etc.) used in your expressions, you MUST create a separate expression for that variable.
       Example: If you have y = a*x^2 + b*x + c, you need THREE separate expressions:
       1. "a = 1" (with sliderBounds for a)
       2. "b = 2" (with sliderBounds for b) 
       3. "c = 3" (with sliderBounds for c)
       4. "y = a*x^2 + b*x + c" (the main function)
       
       The sliderBounds property should be used to configure:
       - min: Minimum value of the slider (e.g., -5)
       - max: Maximum value of the slider (e.g., 5)
       - value: Current value of the slider (e.g., 1)
       - step: Step size for the slider (e.g., 0.1 for fine control)
       - label: Human-readable label (e.g., "Amplitude", "Frequency")
       - isPlaying: true/false for animation
       - playSpeed: Animation speed (1 = normal speed)

       Example sliderBounds configuration:
       {
         "min": -5,
         "max": 5,
         "value": 1,
         "step": 0.1,
         "label": "Amplitude",
         "isPlaying": false,
         "playSpeed": 1
       }

       x and y are NOT supposed to be used as slider variables
           `),
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
  description: "Interactive math graphing (Desmos LaTeX). WHEN TO USE: call immediately for coordinate geometry, algebraic functions, polynomials, basic calculus visualizations, inequalities, piecewise, parametric/polar curves where interactivity helps exploration. DO NOT narrate tool usage—just call. ALWAYS include sliders for parameters (a,b,c,...) as separate expressions with sliderBounds; add animations (t) where useful; use draggable points when appropriate; set domain/range thoughtfully. DECISION: For simple-to-intermediate math education, prioritize this tool. If a static high-fidelity figure is also helpful, invoke plotTool as well. TRIGGERS: equations like y=f(x), implicit curves, inequalities, piecewise, parametric (x(t),y(t)), polar r=f(theta), requests to \"explore\", \"tune\", or \"interactive\" graphs.",
  inputSchema: graphSchema,
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
