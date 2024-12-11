import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { TimeoutProvider } from "./useInactive";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TimeoutProvider>
      <App />

    </TimeoutProvider>
  </React.StrictMode>,
);
