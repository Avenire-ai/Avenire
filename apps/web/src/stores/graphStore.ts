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
          set({ graphRef: ref })
          if (ref?.current) {
            try {
              ref.current.setExpressions(get().expressions);
            } catch (error) {
              set({ error: "Failed to set graph ref" });
            }
          }

        },

        addExpression: (expressions) => {
          const { graphRef } = get();
          if (graphRef?.current) {
            try {
              graphRef.current.setExpressions(expressions);
              set((state) => ({
                expressions: [...state.expressions, ...expressions],
                error: null,
              }));
            } catch (error) {
              set({ error: "Failed to add expressions" });
            }
          }
        },

        clearGraph: () => {
          const { graphRef } = get();
          if (graphRef?.current) {
            try {
              graphRef.current.setBlank();
              set({ expressions: [], error: null });
            } catch (error) {
              set({ error: "Failed to clear graph" });
            }
          }
        },

        setExpressions: (expressions) => {
          const { graphRef } = get();
          if (graphRef?.current) {
            try {
              graphRef.current.setExpressions(expressions);
              set({ expressions, error: null });
            } catch (error) {
              set({ error: "Failed to set expressions" });
            }
          }
        },

        initialize: () => set({ isInitialized: true }),

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