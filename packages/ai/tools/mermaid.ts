import { tool } from "ai";
import { z } from "zod";
import { generateText } from "ai";
import { fermion } from "../models";

const mermaidSchema = z.object({
  prompt: z.string().describe(
    `A description of the diagram to generate. The prompt should describe:
    1. The type of diagram (preferably flowchart, sequence, or class diagram)
    2. The relationships and connections between elements
    3. Any specific styling or formatting requirements
    
    Examples:
    - "Create a flowchart showing the user authentication process"
    - "Generate a sequence diagram for an e-commerce checkout flow"
    - "Make a class diagram for a blog system with User, Post, and Comment classes"
    `
  ),
  diagramType: z.enum([
    "flowchart",
    "sequence",
    "class",
    "state",
    "er",
    "gantt",
    "pie",
    "gitGraph"
  ]).describe("The type of mermaid diagram to generate. Prefer flowchart, sequence, or class diagrams for most use cases."),
});

function extractMermaidCode(text: string): string {
  const match = text.match(/```mermaid\n([\s\S]*?)```/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text.trim();
}

export const mermaidTool = tool({
  description: "A tool for generating Mermaid diagram code based on a text prompt. Always use this tool whenever a diagram or visualization would help explain concepts, processes, or relationships. The tool primarily supports flowcharts, sequence diagrams, and class diagrams, which are most commonly used for visualizing software systems and processes.",
  parameters: mermaidSchema,
  execute: async ({ prompt, diagramType }) => {
    let mermaidCode = '';

    const { text } = await generateText({
      model: fermion.languageModel("fermion-core"),
      system: `You are a Mermaid diagram expert. Generate valid Mermaid diagram code based on the user's prompt.
        Follow these rules:
        1. Always use proper Mermaid syntax
        2. Include appropriate indentation
        3. Use meaningful node names and labels
        4. Add descriptive comments where helpful
        5. Ensure the diagram is clear and well-structured
        6. Only output the Mermaid code, no explanations
        7. Prefer flowchart, sequence, or class diagrams unless specifically requested otherwise
        
        For ${diagramType} diagrams specifically:
        ${getDiagramTypeInstructions(diagramType)}`,
      prompt: `Generate a ${diagramType} diagram for: ${prompt}`,
    });

    mermaidCode = extractMermaidCode(text);

    return mermaidCode;
  },
});

function getDiagramTypeInstructions(diagramType: string): string {
  switch (diagramType) {
    case "flowchart":
      return `- Use proper node shapes ([] for processes, {} for decisions, () for start/end)
      - Use --> for connections
      - Add labels on connections using |text|
      - Use subgraphs for grouping related nodes`;
    case "sequence":
      return `- Define participants first
      - Use proper arrow types (->>, -->, -x, --x)
      - Add activation bars when needed
      - Use alt/opt/loop for conditional flows`;
    case "class":
      return `- Define class properties and methods
      - Use proper visibility modifiers (+, -, #)
      - Show relationships with proper cardinality
      - Use inheritance (--|>), composition (*--), and aggregation (o--)`;
    case "state":
      return `- Use [*] for start/end states
      - Show transitions with proper arrows
      - Use composite states when needed
      - Add entry/exit points for complex states`;
    case "er":
      return `- Use proper entity relationship notation
      - Show cardinality (||--o{, }|..|{)
      - Define attributes clearly
      - Use proper relationship labels`;
    case "gantt":
      return `- Include title and dateFormat
      - Use sections for grouping
      - Add proper durations
      - Use dependencies (after) when needed`;
    case "pie":
      return `- Include a title
      - Use clear category names
      - Show percentages or values
      - Keep it simple and readable`;
    case "gitGraph":
      return `- Use proper git commands
      - Show branches and merges
      - Include commit messages
      - Show proper checkout operations`;
    default:
      return "";
  }
}