"use client";

import { createContext, useContext } from "react";

type SearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({
  value,
  children,
}: {
  value: SearchContextValue;
  children: React.ReactNode;
}) {
  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
