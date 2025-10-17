// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SearchProvider } from "../context/SearchContext";
import { Toaster } from "react-hot-toast";
import { ProgressProvider } from "../context/ProgressContext";
import { StudentCoursesProvider } from "../context/StudentCoursesContext";
import { UserProvider } from "../context/UserContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ProgressProvider>
        <SearchProvider>
          <StudentCoursesProvider>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            <Component {...pageProps} />
          </StudentCoursesProvider>
        </SearchProvider>
      </ProgressProvider>
    </UserProvider>
  );
}
