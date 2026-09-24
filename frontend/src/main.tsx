import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { EmailLogsProvider } from "./contexts/EmaillogsContext.tsx";
import { SenderAccountsProvider } from "./contexts/SenderAccountsContext.tsx";
import HtmlTemplatesProvider from "./contexts/HtmlTemplatesContext.tsx";
import RecipientsContextProvider from "./contexts/RecipientsContext.tsx";
import { CampaignProvider } from "./contexts/CampaignContext.tsx";
import { UploadProvider } from "./contexts/UploadContext.tsx";
import ErrorBoundary from "./components/ErrorBoundry.tsx";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <EmailLogsProvider>
        <AuthProvider>
          <SenderAccountsProvider>
            <CampaignProvider>
              <HtmlTemplatesProvider>
                <RecipientsContextProvider>
                  <UploadProvider >
                    <App />
                  </UploadProvider >
                </RecipientsContextProvider>
              </HtmlTemplatesProvider>
            </CampaignProvider>
          </SenderAccountsProvider>
        </AuthProvider>
      </EmailLogsProvider>
    </BrowserRouter>
  </ErrorBoundary>
);