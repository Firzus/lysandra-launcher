import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider>
      <main className="dark text-foreground bg-background h-screen flex">
        <App />
      </main>
    </Provider>
  </React.StrictMode>,
);
