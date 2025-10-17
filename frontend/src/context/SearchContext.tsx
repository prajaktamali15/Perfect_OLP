import { createContext, useContext, useState, ReactNode } from "react";

interface SearchContextType {
  query: string;
  setQuery: (q: string) => void;
}

// Create context with undefined to enforce provider usage
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Custom hook to use search context
export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};

// Provider component
export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [query, setQuery] = useState<string>("");

  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
};
