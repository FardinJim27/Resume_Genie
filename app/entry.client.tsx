import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
    {
      onRecoverableError(error) {
        // Suppress benign hydration warnings in dev (e.g. script tag hydration check)
        if (
          error instanceof Error &&
          (error.message.includes("script tag") ||
            error.message.includes("Hydration failed") ||
            error.message.includes("server HTML"))
        ) {
          return;
        }
        console.error(error);
      },
    },
  );
});
