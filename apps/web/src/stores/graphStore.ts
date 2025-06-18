import { RefObject } from "react";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface GraphState {
  graphRef: RefObject<Desmos.Calculator | null> | null;
  expressions: Desmos.ExpressionState[];
  isInitialized: boolean;
  error: string | null;
}

interface GraphActions {
  setGraphRef: (ref: RefObject<Desmos.Calculator | null>) => void;
  addExpression: (expression: Desmos.ExpressionState[]) => void;
  clearGraph: () => void;
  setExpressions: (expressions: Desmos.ExpressionState[]) => void;
  initialize: () => void;
  setError: (error: string | null) => void;
}

type GraphStore = GraphState & GraphActions;

const initialState: GraphState = {
  graphRef: null,
  expressions: [],
  isInitialized: false,
  error: null,
};

export const useGraphStore = create<GraphStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setGraphRef: (ref) => {
          set({ graphRef: ref });
        },

        addExpression: (expressions) => {
          const { graphRef, isInitialized } = get();

          // Update store state first
          set((state) => ({
            expressions: [...state.expressions, ...expressions],
            error: null,
          }));

          // Then update graph if initialized
          if (isInitialized && graphRef?.current) {
            try {
              graphRef.current.setExpressions(get().expressions);
            } catch (error) {
              set({ error: "Failed to add expressions" });
            }
          }
        },

        clearGraph: () => {
          const { graphRef, isInitialized } = get();

          // Update store state first
          set({ expressions: [], error: null });

          // Then update graph if initialized
          if (isInitialized && graphRef?.current) {
            try {
              graphRef.current.setBlank();
            } catch (error) {
              set({ error: "Failed to clear graph" });
            }
          }
        },

        setExpressions: (expressions) => {
          const { graphRef, isInitialized } = get();

          // Update store state first
          set({ expressions, error: null });

          // Then update graph if initialized
          if (isInitialized && graphRef?.current) {
            try {
              graphRef.current.setExpressions(expressions);
            } catch (error) {
              set({ error: "Failed to set expressions" });
            }
          }
        },

        initialize: () => {
          const { graphRef, expressions } = get();

          if (graphRef?.current) {
            try {
              // Set initial expressions if any exist
              if (expressions.length > 0) {
                graphRef.current.setExpressions(expressions);
              }
              set({ isInitialized: true, error: null });
            } catch (error) {
              set({ error: "Failed to initialize graph" });
            }
          }
        },

        setError: (error) => set({ error }),
      }),
      {
        name: "graph-store",
        partialize: (state) => ({
          expressions: state.expressions,
          isInitialized: state.isInitialized,
        }),
      }
    ),
    {
      name: "graph-store",
    }
  )
);