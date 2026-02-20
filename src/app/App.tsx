import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ErrorBoundary } from "./components/error-boundary";

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}