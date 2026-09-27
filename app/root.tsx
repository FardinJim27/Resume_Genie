import {
  isRouteErrorResponse,
  Outlet,
  Scripts,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import Footer from "~/components/Footer";
import { ThemeProvider } from "~/lib/theme";

export const meta: Route.MetaFunction = () => [
  { title: "Resume Genie - AI Resume Analyzer" },
  { name: "description", content: "AI-powered resume analyzer providing ATS scoring, comprehensive feedback, and improvement suggestions." },
  { property: "og:title", content: "Resume Genie - AI Resume Analyzer" },
  { property: "og:description", content: "AI-powered resume analyzer providing ATS scoring, comprehensive feedback, and improvement suggestions." },
];

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Resume Genie - AI Resume Analyzer</title>
        <meta
          name="description"
          content="AI-powered resume analyzer providing ATS scoring, comprehensive feedback, and improvement suggestions."
        />
        <meta property="og:title" content="Resume Genie - AI Resume Analyzer" />
        <meta
          property="og:description"
          content="AI-powered resume analyzer providing ATS scoring, comprehensive feedback, and improvement suggestions."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var stored = localStorage.getItem('resume_genie_theme');
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                var isDark = stored === 'dark' || (!stored && prefersDark) || (stored === 'system' && prefersDark);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        {typeof document === "undefined" && <Scripts />}
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-slate-400 font-medium text-sm">Loading Resume Genie...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Outlet />
      <Footer />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
