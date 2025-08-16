import { tool } from "ai";
import { z } from "zod";
import { generateText } from "ai";
import { fermion } from "../models";

const plotToolSchema = z.object({
  prompt: z.string().describe(
    `A description of the plot to generate. The prompt should describe:
    1. The type of plot (e.g., line, scatter, 3D, heatmap, etc.)
    2. The mathematical function, data, or process to visualize
    3. Any specific requirements (axes, labels, ranges, etc.)
    
    Examples:
    - "Plot a sine wave from 0 to 2*pi."
    - "Show a 3D surface plot of z = sin(x) * cos(y) for x, y in [-5, 5]."
    - "Visualize a histogram of 1000 samples from a normal distribution."
    - "Plot the Lorentz attractor."
    - "Show the area under y = x^2 from x=0 to x=2."
    - "Create a 3D plot showing the trajectory of a charged particle in electric and magnetic fields."
    - "Plot a heatmap of a function f(x,y) = sin(x) * cos(y)."
    - "Show a vector field plot of a 2D function."
    - "Visualize definite integrals with shaded areas under curves."
    - "Plot complex mathematical functions like derivatives, integrals, or differential equations."
    `
  ),
  plotType: z.enum([
    "line",
    "scatter",
    "bar",
    "histogram",
    "3d",
    "heatmap",
    "surface",
    "contour",
    "quiver",
    "vectorfield",
    "area",
    "other"
  ]).optional().describe("The type of plot to generate. If unsure, leave blank and the tool will infer the best type."),
});

function extractPlotCode(text: string): string {
  const match = text.match(/```matplotlib\n([\s\S]*?)```/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text.trim();
}

export const plotTool = tool({
  description: "Static plotting and math/data visualization. WHEN TO USE: call immediately to plot/graph/visualize functions, datasets, integrals/areas, vector fields, parametric/polar curves, histograms/distributions, 3D surfaces/trajectories, phase portraits/attractors. Use whenever it might help the user to understand the concept deeply and clearly. DO NOT narrate tool usage—just call. DECISION: For coordinate geometry, basic calculus, polynomials, and algebra, prefer graphTool for interactivity AND also use this tool if a high-fidelity static figure adds value. Use this tool for all static or advanced plots (e.g., ODEs, 3D, heatmaps, quiver, surfaces, histograms). RULES: output must be a single ```matplotlib code block; no comments; only numpy/pandas allowed besides the pre-injected plt; do not import plt; define every variable; include labels/titles/legends when helpful; choose figure size and resolution appropriately; if plotType is provided, respect it. TRIGGERS: mentions of plot/graph/visualize/draw, function f(x), derivative/integral/area, slope field/vector field, parametric/polar, 3D/surface/heatmap, histogram/distribution, trajectory/attractor/phase space.",
  inputSchema: plotToolSchema,
  execute: async ({ prompt, plotType }) => {
    let code = '';

    const { text } = await generateText({
      model: fermion.languageModel("fermion-core"),
      system: `You are a Python plotting expert. Generate valid Python code for mathematical and data visualizations based on the user's prompt.
        Follow these rules:
        1. For simple coordinate geometry, calculus, polynomials, and algebra, ALWAYS use BOTH this tool (for static/advanced plots) AND the graphTool (for interactive/educational plots).
        2. Use ONLY numpy, pandas, and matplotlib. DO NOT use or suggest any other libraries.
        3. Do NOT include import matplotlib.pyplot as plt; it is handled automatically.
        4. Do NOT include ANY comments in the code.
        5. Do NOT mention the plotting library or backend in the code or explanation.
        6. Ensure ALL variables are defined before use.
        7. The code MUST be fully functional and work on the first try.
        8. Output ONLY the code, inside a \`\`\`matplotlib code block, with no explanation.
        9. Do NOT include any code or text outside the code block.
        10. If the plotType is provided, use it to guide the plot style, but infer the best type if not specified.
        11. Focus on the math or data being visualized, not the library details.
        12. STRICT: No comments, no backend mention, no undefined variables, no extra text.
        13. CRITICAL: For trajectory plots, dynamical systems, and attractors, use sufficient simulation time to show complete behavior.

        EXAMPLES AND GUIDELINES:

        1. **Lorentz Attractor (3D Plot):**
        \`\`\`matplotlib
        import numpy as np
        sigma = 10
        rho = 28
        beta = 8/3
        x0 = 0.1
        y0 = 0.1
        z0 = 0.1
        dt = 0.01
        t = np.arange(0, 100, dt)
        n = len(t)
        x = np.zeros(n)
        y = np.zeros(n)
        z = np.zeros(n)
        x[0] = x0
        y[0] = y0
        z[0] = z0
        for i in range(1, n):
            dx = sigma * (y[i-1] - x[i-1])
            dy = x[i-1] * (rho - z[i-1]) - y[i-1]
            dz = x[i-1] * y[i-1] - beta * z[i-1]
            x[i] = x[i-1] + dx * dt
            y[i] = y[i-1] + dy * dt
            z[i] = z[i-1] + dz * dt
        fig = plt.figure(figsize=(12, 10))
        ax = fig.add_subplot(111, projection='3d')
        ax.plot(x, y, z, lw=0.5, color='blue', alpha=0.8)
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.set_title('Lorentz Attractor (Extended Simulation)')
        \`\`\`

        2. **Simple 2D Function Plot:**
        \`\`\`matplotlib
        import numpy as np
        x = np.linspace(0, 2*np.pi, 100)
        y = np.sin(x)
        plt.plot(x, y)
        plt.xlabel('x')
        plt.ylabel('sin(x)')
        plt.title('Sine Wave')
        plt.grid(True)
        \`\`\`

        3. **Area Under Curve (Integral):**
        \`\`\`matplotlib
        import numpy as np
        x = np.linspace(0, 2, 100)
        y = x**2
        plt.plot(x, y, 'b-', linewidth=2)
        plt.fill_between(x, y, alpha=0.3, color='blue')
        plt.xlabel('x')
        plt.ylabel('y = x²')
        plt.title('Area under y = x² from 0 to 2')
        plt.grid(True)
        \`\`\`

        4. **3D Surface Plot:**
        \`\`\`matplotlib
        import numpy as np
        x = np.linspace(-5, 5, 100)
        y = np.linspace(-5, 5, 100)
        X, Y = np.meshgrid(x, y)
        Z = np.sin(X) * np.cos(Y)
        fig = plt.figure(figsize=(10, 8))
        ax = fig.add_subplot(111, projection='3d')
        surf = ax.plot_surface(X, Y, Z, cmap='viridis')
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.set_title('z = sin(x) * cos(y)')
        fig.colorbar(surf)
        \`\`\`

        5. **Vector Field (Quiver Plot):**
        \`\`\`matplotlib
        import numpy as np
        x = np.linspace(-2, 2, 20)
        y = np.linspace(-2, 2, 20)
        X, Y = np.meshgrid(x, y)
        U = -Y
        V = X
        plt.figure(figsize=(8, 8))
        plt.quiver(X, Y, U, V)
        plt.xlabel('x')
        plt.ylabel('y')
        plt.title('Vector Field: (-y, x)')
        plt.axis('equal')
        \`\`\`

        6. **Histogram:**
        \`\`\`matplotlib
        import numpy as np
        data = np.random.normal(0, 1, 1000)
        plt.hist(data, bins=30, alpha=0.7, color='skyblue', edgecolor='black')
        plt.xlabel('Value')
        plt.ylabel('Frequency')
        plt.title('Histogram of Normal Distribution')
        plt.grid(True, alpha=0.3)
        \`\`\`

        7. **Trajectory Plot (Particle Motion):**
        \`\`\`matplotlib
        import numpy as np
        t = np.linspace(0, 50, 5000)
        x = np.cos(t) * np.exp(-0.1*t)
        y = np.sin(t) * np.exp(-0.1*t)
        z = t * 0.1
        fig = plt.figure(figsize=(12, 10))
        ax = fig.add_subplot(111, projection='3d')
        ax.plot(x, y, z, lw=1, color='red')
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.set_title('Spiral Trajectory with Decay')
        \`\`\`

        8. **Rossler Attractor:**
        \`\`\`matplotlib
        import numpy as np
        a = 0.2
        b = 0.2
        c = 5.7
        dt = 0.01
        t = np.arange(0, 200, dt)
        n = len(t)
        x = np.zeros(n)
        y = np.zeros(n)
        z = np.zeros(n)
        x[0] = 0.1
        y[0] = 0.1
        z[0] = 0.1
        for i in range(1, n):
            dx = -y[i-1] - z[i-1]
            dy = x[i-1] + a * y[i-1]
            dz = b + z[i-1] * (x[i-1] - c)
            x[i] = x[i-1] + dx * dt
            y[i] = y[i-1] + dy * dt
            z[i] = z[i-1] + dz * dt
        fig = plt.figure(figsize=(12, 10))
        ax = fig.add_subplot(111, projection='3d')
        ax.plot(x, y, z, lw=0.5, color='green', alpha=0.8)
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.set_title('Rossler Attractor (Extended Simulation)')
        \`\`\`

        TRAJECTORY AND DYNAMICAL SYSTEM GUIDELINES:
        - For attractors (Lorentz, Rossler, etc.): Use simulation time >= 100 units with dt <= 0.01
        - For particle trajectories: Use sufficient time to show complete motion patterns
        - For periodic systems: Run for at least 3-5 complete cycles
        - For chaotic systems: Use longer simulation times (100-200 units) to reveal attractor structure
        - Use appropriate step sizes: dt = 0.01 for smooth trajectories, dt = 0.001 for high precision
        - For 3D trajectories: Use larger figure sizes (12x10) for better visibility
        - Include proper labels and titles indicating extended simulation
        - Use alpha transparency for better visualization of dense trajectory data

        PLOT TYPE GUIDELINES:
        - Use line plots for continuous functions and time series
        - Use scatter plots for discrete data points
        - Use 3D plots for complex mathematical surfaces and trajectories
        - Use heatmaps for 2D function visualization
        - Use quiver plots for vector fields
        - Use histograms for data distribution analysis
        - Use area plots for integrals and cumulative data
        - Always include proper labels, titles, and grid when appropriate
        - Use appropriate color schemes and figure sizes
        - For complex plots, ensure all mathematical operations are correct
        `,
      prompt: `Generate a${plotType ? ` ${plotType}` : ''} plot for: ${prompt}`,
    });

    code = extractPlotCode(text);

    return code;
  },
}); 
