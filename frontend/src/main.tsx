import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { EmailLogsProvider } from "./contexts/EmaillogsContext.tsx";
import { SenderAccountsContext } from "./contexts/SenderAccountsContext.tsx";
import HtmlTemplatesProvider from "./contexts/HtmlTemplatesContext.tsx";
import RecipientsContextProvider from "./contexts/RecipientsContext.tsx";
import { CampaignProvider } from "./contexts/CampaignContext.tsx";
import ErrorBoundary from "./components/ErrorBoundry.tsx";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <EmailLogsProvider>
        <AuthProvider>
          <SenderAccountsContext>
            <CampaignProvider>
              <HtmlTemplatesProvider>
                <RecipientsContextProvider>
                  <App />
                </RecipientsContextProvider>
              </HtmlTemplatesProvider>
            </CampaignProvider>
          </SenderAccountsContext>
        </AuthProvider>
      </EmailLogsProvider>
    </BrowserRouter>
  </ErrorBoundary>
);