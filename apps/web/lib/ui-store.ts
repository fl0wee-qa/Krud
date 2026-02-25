"use client";

import { create } from "zustand";

type UiState = {
  collapsedSidebar: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  toggleTheme: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  collapsedSidebar: false,
  theme: "light",
  toggleSidebar: () => set((state) => ({ collapsedSidebar: !state.collapsedSidebar })),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light"
    }))
}));
