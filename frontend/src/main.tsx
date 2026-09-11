import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import {EmailLogsProvider} from "./contexts/EmaillogsContext.tsx";
import {SenderAccountsContext} from "./contexts/SenderAccountsContext.tsx";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <EmailLogsProvider>
        <AuthProvider>
          <SenderAccountsContext>
            <App />
          </SenderAccountsContext>
        </AuthProvider>
      </EmailLogsProvider>
    </BrowserRouter>
  </StrictMode>
);