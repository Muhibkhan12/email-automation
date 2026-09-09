// AdminSettings.tsx
import React, { useState } from "react";
import {
  Settings,
  Save,
  Globe,
  Mail,
  Shield,
  Bell,
  Key,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Menu,
  Download,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

interface SMTPConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  encryption: "TLS" | "SSL" | "None";
  status: "Active" | "Inactive" | "Error";
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  status: "Active" | "Inactive";
}

/* ---------------------------------------------------------------------- */
/*  AdminSidebar Component                                                */
/* ---------------------------------------------------------------------- */

const AdminSidebar = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="flex h-full w-64 flex-col bg-[#171A21] border-r border-[#2A2E37]">
      <div className="flex items-center justify-between p-4 border-b border-[#2A2E37]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#FF6A39] flex items-center justify-center">
            <span className="text-white font-bold text-sm">MF</span>
          </div>
          <span className="text-[#E8E6E1] font-semibold text-sm">MailForge</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded hover:bg-[#2A2E37] text-[#8B8D94]"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="text-[10px] font-medium text-[#8B8D94] uppercase tracking-wider px-3 py-2">
          Menu
        </div>
        <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors">
          <Settings size={18} className="text-[#8B8D94]" />
          <span>Dashboard</span>
        </button>
        <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#E8E6E1] bg-[#FF6A39]/10 border border-[#FF6A39]/20">
          <Settings size={18} className="text-[#FF6A39]" />
          <span>Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors">
          <Users size={18} className="text-[#8B8D94]" />
          <span>Users</span>
        </button>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminSettings = () => {
  const [activeSection, setActiveSection] = useState("general");
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // General settings state
  const [workspaceName, setWorkspaceName] = useState("MailForge Platform");
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [language, setLanguage] = useState("English");

  // Security settings state
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [passwordPolicy, setPasswordPolicy] = useState("strict");
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");

  // Notification settings state
  const [notifCampaigns, setNotifCampaigns] = useState(true);
  const [notifSystem, setNotifSystem] = useState(true);
  const [notifSecurity, setNotifSecurity] = useState(true);
  const [notifBilling, setNotifBilling] = useState(false);
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  // SMTP configurations state
  const [smtpConfigs, setSmtpConfigs] = useState<SMTPConfig[]>([
    {
      id: "smtp1",
      name: "Primary SMTP",
      host: "smtp.mailforge.io",
      port: 587,
      username: "smtp@mailforge.io",
      encryption: "TLS",
      status: "Active",
    },
    {
      id: "smtp2",
      name: "Backup SMTP",
      host: "smtp2.mailforge.io",
      port: 465,
      username: "backup@mailforge.io",
      encryption: "SSL",
      status: "Inactive",
    },
    {
      id: "smtp3",
      name: "Custom SMTP",
      host: "smtp.company.com",
      port: 587,
      username: "custom@company.com",
      encryption: "TLS",
      status: "Error",
    },
  ]);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: "webhook1",
      name: "Campaign Events",
      url: "https://api.company.com/webhooks/campaign",
      status: "Active",
    },
    {
      id: "webhook2",
      name: "System Events",
      url: "https://api.company.com/webhooks/system",
      status: "Inactive",
    },
  ]);

  const settingsSections = [
    { id: "general", label: "General", icon: Settings },
    { id: "smtp", label: "SMTP Configuration", icon: Mail },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "api", label: "API & Webhooks", icon: Key },
    { id: "billing", label: "Billing", icon: DollarSign },
  ];

  const handleCopyApiKey = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addIpToWhitelist = () => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (newIp && !ipWhitelist.includes(newIp) && ipRegex.test(newIp)) {
      setIpWhitelist([...ipWhitelist, newIp]);
      setNewIp("");
    } else if (newIp && !ipWhitelist.includes(newIp)) {
      alert("Please enter a valid IP address");
    }
  };

  const removeIpFromWhitelist = (ip: string) => {
    setIpWhitelist(ipWhitelist.filter((i) => i !== ip));
  };

  const handleEditSMTP = (id: string) => {
    // Implement edit functionality
    console.log("Edit SMTP:", id);
    alert(`Edit SMTP configuration: ${id}`);
  };

  const handleDeleteSMTP = (id: string) => {
    if (window.confirm("Are you sure you want to delete this SMTP configuration?")) {
      setSmtpConfigs(smtpConfigs.filter((config) => config.id !== id));
    }
  };

  const handleAddSMTP = () => {
    // Implement add functionality
    alert("Add new SMTP configuration");
  };

  const handleEditWebhook = (id: string) => {
    console.log("Edit webhook:", id);
    alert(`Edit webhook: ${id}`);
  };

  const handleDeleteWebhook = (id: string) => {
    if (window.confirm("Are you sure you want to delete this webhook?")) {
      setWebhooks(webhooks.filter((webhook) => webhook.id !== id));
    }
  };

  const handleAddWebhook = () => {
    alert("Add new webhook");
  };

  const handleSaveChanges = () => {
    // Implement save functionality
    alert("Settings saved successfully!");
  };

  const getStatusBadge = (status: SMTPConfig["status"]) => {
    const styles = {
      Active: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
      Inactive: { bg: "bg-slate-500/15", text: "text-slate-400" },
      Error: { bg: "bg-rose-500/15", text: "text-rose-400" },
    };
    const s = styles[status];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-medium sm:px-2 sm:text-[10px] ${s.bg} ${s.text}`}
      >
        <span
          className={`h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5 ${
            status === "Active"
              ? "bg-emerald-400"
              : status === "Inactive"
              ? "bg-slate-400"
              : "bg-rose-400"
          }`}
        />
        <span className="hidden xs:inline">{status}</span>
        <span className="xs:hidden">{status.charAt(0)}</span>
      </span>
    );
  };

  const getWebhookStatusBadge = (status: Webhook["status"]) => {
    const styles = {
      Active: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
      Inactive: { bg: "bg-amber-500/15", text: "text-amber-400" },
    };
    const s = styles[status];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-medium sm:px-2 sm:text-[10px] ${s.bg} ${s.text}`}
      >
        <span
          className={`h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5 ${
            status === "Active" ? "bg-emerald-400" : "bg-amber-400"
          }`}
        />
        <span className="hidden xs:inline">{status}</span>
        <span className="xs:hidden">{status.charAt(0)}</span>
      </span>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="workspaceName"
                  className="mb-1.5 block text-[11px] font-medium text-[#C7C9CE] sm:mb-2 sm:text-sm"
                >
                  Platform Name
                </label>
                <input
                  id="workspaceName"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 py-2 text-[11px] text-[#E8E6E1] outline-none transition focus:border-[#FF6A39] sm:px-4 sm:py-2.5 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="timezone"
                  className="mb-1.5 block text-[11px] font-medium text-[#C7C9CE] sm:mb-2 sm:text-sm"
                >
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 py-2 text-[11px] text-[#E8E6E1] outline-none transition focus:border-[#FF6A39] sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (GMT-4)</option>
                  <option value="Europe/London">Europe/London (GMT+0)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                  <option value="Asia/Karachi">Asia/Karachi (GMT+5)</option>
                  <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="dateFormat"
                  className="mb-1.5 block text-[11px] font-medium text-[#C7C9CE] sm:mb-2 sm:text-sm"
                >
                  Date Format
                </label>
                <select
                  id="dateFormat"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 py-2 text-[11px] text-[#E8E6E1] outline-none transition focus:border-[#FF6A39] sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="language"
                  className="mb-1.5 block text-[11px] font-medium text-[#C7C9CE] sm:mb-2 sm:text-sm"
                >
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 py-2 text-[11px] text-[#E8E6E1] outline-none transition focus:border-[#FF6A39] sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "smtp":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#E8E6E1] sm:text-base">
                  SMTP Configurations
                </h3>
                <p className="text-[10px] text-[#8B8D94] sm:text-xs">
                  Manage your SMTP server configurations
                </p>
              </div>
              <button
                onClick={handleAddSMTP}
                className="flex items-center gap-1.5 rounded-lg bg-[#FF6A39] px-3 py-1.5 text-[10px] font-medium text-white transition hover:bg-[#e85a2c] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                <Plus size={12} className="sm:h-[13px] sm:w-[13px] lg:h-[14px] lg:w-[14px]" />
                <span className="hidden xs:inline">Add SMTP</span>
                <span className="xs:hidden">Add</span>
              </button>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {smtpConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:flex-row sm:items-center sm:p-4"
                >
                  <div className="min-w-0 space-y-0.5 sm:space-y-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h4 className="truncate text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                        {config.name}
                      </h4>
                      {getStatusBadge(config.status)}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-[#8B8D94] sm:gap-x-4 sm:text-xs">
                      <span>Host: {config.host}</span>
                      <span>Port: {config.port}</span>
                      <span>Enc: {config.encryption}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => handleEditSMTP(config.id)}
                      className="rounded-lg border border-[#2A2E37] px-2 py-1 text-[9px] font-medium text-[#C7C9CE] transition hover:bg-[#1B1E24] sm:px-3 sm:py-1.5 sm:text-xs"
                    >
                      <Edit
                        size={10}
                        className="mr-0.5 inline sm:mr-1 sm:h-[11px] sm:w-[11px] lg:h-[12px] lg:w-[12px]"
                      />
                      <span className="hidden xs:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSMTP(config.id)}
                      className="rounded-lg border border-rose-500/30 px-2 py-1 text-[9px] font-medium text-rose-400 transition hover:bg-rose-500/10 sm:px-3 sm:py-1.5 sm:text-xs"
                    >
                      <Trash2
                        size={10}
                        className="mr-0.5 inline sm:mr-1 sm:h-[11px] sm:w-[11px] lg:h-[12px] lg:w-[12px]"
                      />
                      <span className="hidden xs:inline">Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                  Two-Factor Authentication
                </h4>
                <p className="text-[9px] text-[#8B8D94] sm:text-xs">
                  Require 2FA for all admin accounts
                </p>
              </div>
              <button
                onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition sm:h-6 sm:w-11 ${
                  twoFactorAuth ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
                role="switch"
                aria-checked={twoFactorAuth}
                aria-label="Toggle two-factor authentication"
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition sm:h-5 sm:w-5 ${
                    twoFactorAuth ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                Session Timeout
              </h4>
              <p className="mb-2 text-[9px] text-[#8B8D94] sm:mb-3 sm:text-xs">
                Auto-logout after inactivity
              </p>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 py-2 text-[11px] text-[#E8E6E1] outline-none transition focus:border-[#FF6A39] sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
              </select>
            </div>

            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                Password Policy
              </h4>
              <p className="mb-2 text-[9px] text-[#8B8D94] sm:mb-3 sm:text-xs">
                Password complexity requirements
              </p>
              <select
                value={passwordPolicy}
                onChange={(e) => setPasswordPolicy(e.target.value)}
                className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 py-2 text-[11px] text-[#E8E6E1] outline-none transition focus:border-[#FF6A39] sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <option value="basic">Basic (min 8 characters)</option>
                <option value="medium">
                  Medium (8+ chars, 1 uppercase, 1 number)
                </option>
                <option value="strict">
                  Strict (12+ chars, upper, lower, number, symbol)
                </option>
              </select>
            </div>

            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                IP Whitelist
              </h4>
              <p className="mb-2 text-[9px] text-[#8B8D94] sm:mb-3 sm:text-xs">
                Restrict admin access to specific IPs
              </p>
              <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:mb-3">
                <input
                  type="text"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="Enter IP address"
                  className="flex-1 rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 py-1.5 text-[11px] text-[#E8E6E1] outline-none transition focus:border-[#FF6A39] sm:px-4 sm:py-2 sm:text-sm"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addIpToWhitelist();
                    }
                  }}
                />
                <button
                  onClick={addIpToWhitelist}
                  className="rounded-lg bg-[#FF6A39] px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-[#e85a2c] sm:px-4 sm:py-2 sm:text-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {ipWhitelist.map((ip) => (
                  <span
                    key={ip}
                    className="inline-flex items-center gap-1 rounded-full bg-[#2A2E37] px-2 py-0.5 text-[9px] text-[#C7C9CE] sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs"
                  >
                    {ip}
                    <button
                      onClick={() => removeIpFromWhitelist(ip)}
                      className="text-[#8B8D94] transition hover:text-[#E8E6E1]"
                      aria-label={`Remove ${ip} from whitelist`}
                    >
                      <X
                        size={10}
                        className="sm:h-[11px] sm:w-[11px] lg:h-[12px] lg:w-[12px]"
                      />
                    </button>
                  </span>
                ))}
                {ipWhitelist.length === 0 && (
                  <span className="text-[9px] text-[#8B8D94] sm:text-xs">
                    No IPs whitelisted
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                  Campaign Notifications
                </h4>
                <p className="text-[9px] text-[#8B8D94] sm:text-xs">
                  Campaign completion and failure alerts
                </p>
              </div>
              <button
                onClick={() => setNotifCampaigns(!notifCampaigns)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition sm:h-6 sm:w-11 ${
                  notifCampaigns ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
                role="switch"
                aria-checked={notifCampaigns}
                aria-label="Toggle campaign notifications"
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition sm:h-5 sm:w-5 ${
                    notifCampaigns ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                  System Notifications
                </h4>
                <p className="text-[9px] text-[#8B8D94] sm:text-xs">
                  System health and maintenance alerts
                </p>
              </div>
              <button
                onClick={() => setNotifSystem(!notifSystem)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition sm:h-6 sm:w-11 ${
                  notifSystem ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
                role="switch"
                aria-checked={notifSystem}
                aria-label="Toggle system notifications"
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition sm:h-5 sm:w-5 ${
                    notifSystem ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                  Security Alerts
                </h4>
                <p className="text-[9px] text-[#8B8D94] sm:text-xs">
                  Security incidents and login alerts
                </p>
              </div>
              <button
                onClick={() => setNotifSecurity(!notifSecurity)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition sm:h-6 sm:w-11 ${
                  notifSecurity ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
                role="switch"
                aria-checked={notifSecurity}
                aria-label="Toggle security alerts"
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition sm:h-5 sm:w-5 ${
                    notifSecurity ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                  Billing Notifications
                </h4>
                <p className="text-[9px] text-[#8B8D94] sm:text-xs">
                  Invoices, payments, and subscription alerts
                </p>
              </div>
              <button
                onClick={() => setNotifBilling(!notifBilling)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition sm:h-6 sm:w-11 ${
                  notifBilling ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
                role="switch"
                aria-checked={notifBilling}
                aria-label="Toggle billing notifications"
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition sm:h-5 sm:w-5 ${
                    notifBilling ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                  Weekly Digest
                </h4>
                <p className="text-[9px] text-[#8B8D94] sm:text-xs">
                  Weekly summary of platform activity
                </p>
              </div>
              <button
                onClick={() => setNotifWeeklyDigest(!notifWeeklyDigest)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition sm:h-6 sm:w-11 ${
                  notifWeeklyDigest ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
                role="switch"
                aria-checked={notifWeeklyDigest}
                aria-label="Toggle weekly digest"
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition sm:h-5 sm:w-5 ${
                    notifWeeklyDigest ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                  Email Digest
                </h4>
                <p className="text-[9px] text-[#8B8D94] sm:text-xs">
                  Receive notifications via email
                </p>
              </div>
              <button
                onClick={() => setEmailDigest(!emailDigest)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition sm:h-6 sm:w-11 ${
                  emailDigest ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
                role="switch"
                aria-checked={emailDigest}
                aria-label="Toggle email digest"
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition sm:h-5 sm:w-5 ${
                    emailDigest ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        );

      case "api":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                API Key
              </h4>
              <p className="mb-2 text-[9px] text-[#8B8D94] sm:mb-3 sm:text-xs">
                Use this key to authenticate API requests
              </p>
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 py-2 sm:px-4 sm:py-2.5">
                    <span className="truncate font-mono text-[10px] text-[#C7C9CE] sm:text-sm">
                      {showApiKey
                        ? "mf_live_9f2a1c7e4b8d3f6091a2c4e"
                        : "••••••••••••••••••••••••"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="rounded-lg border border-[#2A2E37] p-1.5 text-[#8B8D94] transition hover:bg-[#1B1E24] sm:p-2.5"
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? (
                      <EyeOff
                        size={14}
                        className="sm:h-[15px] sm:w-[15px] lg:h-[16px] lg:w-[16px]"
                      />
                    ) : (
                      <Eye
                        size={14}
                        className="sm:h-[15px] sm:w-[15px] lg:h-[16px] lg:w-[16px]"
                      />
                    )}
                  </button>
                  <button
                    onClick={handleCopyApiKey}
                    className="rounded-lg border border-[#2A2E37] p-1.5 text-[#8B8D94] transition hover:bg-[#1B1E24] sm:p-2.5"
                    aria-label="Copy API key"
                  >
                    {copied ? (
                      <Check
                        size={14}
                        className="text-emerald-400 sm:h-[15px] sm:w-[15px] lg:h-[16px] lg:w-[16px]"
                      />
                    ) : (
                      <Copy
                        size={14}
                        className="sm:h-[15px] sm:w-[15px] lg:h-[16px] lg:w-[16px]"
                      />
                    )}
                  </button>
                  <button
                    className="rounded-lg border border-[#2A2E37] p-1.5 text-[#8B8D94] transition hover:bg-[#1B1E24] sm:p-2.5"
                    aria-label="Regenerate API key"
                  >
                    <RefreshCw
                      size={14}
                      className="sm:h-[15px] sm:w-[15px] lg:h-[16px] lg:w-[16px]"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3 sm:mb-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                    Webhooks
                  </h4>
                  <p className="text-[9px] text-[#8B8D94] sm:text-xs">
                    Configure webhook endpoints for events
                  </p>
                </div>
                <button
                  onClick={handleAddWebhook}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#FF6A39] px-2.5 py-1 text-[9px] font-medium text-white transition hover:bg-[#e85a2c] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
                >
                  <Plus
                    size={10}
                    className="sm:h-[11px] sm:w-[11px] lg:h-[12px] lg:w-[12px]"
                  />
                  <span className="hidden xs:inline">Add Webhook</span>
                  <span className="xs:hidden">Add</span>
                </button>
              </div>

              <div className="space-y-2">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="flex flex-col justify-between gap-2 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-2.5 sm:flex-row sm:items-center sm:p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[10px] text-[#E8E6E1] sm:text-sm">
                        {webhook.name}
                      </p>
                      <p className="truncate text-[8px] text-[#8B8D94] sm:text-xs">
                        {webhook.url}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {getWebhookStatusBadge(webhook.status)}
                      <button
                        onClick={() => handleEditWebhook(webhook.id)}
                        className="text-[#8B8D94] transition hover:text-[#E8E6E1]"
                        aria-label={`Edit ${webhook.name}`}
                      >
                        <Edit
                          size={12}
                          className="sm:h-[13px] sm:w-[13px] lg:h-[14px] lg:w-[14px]"
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="text-[#8B8D94] transition hover:text-rose-400"
                        aria-label={`Delete ${webhook.name}`}
                      >
                        <Trash2
                          size={12}
                          className="sm:h-[13px] sm:w-[13px] lg:h-[14px] lg:w-[14px]"
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                API Rate Limits
              </h4>
              <p className="mb-2 text-[9px] text-[#8B8D94] sm:mb-3 sm:text-xs">
                Configure API request limits
              </p>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="requestsPerMinute"
                    className="mb-1.5 block text-[10px] font-medium text-[#C7C9CE] sm:mb-2 sm:text-sm"
                  >
                    Requests per minute
                  </label>
                  <input
                    id="requestsPerMinute"
                    type="number"
                    defaultValue="1000"
                    className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 py-1.5 text-[11px] text-[#E8E6E1] outline-none transition focus:border-[#FF6A39] sm:px-4 sm:py-2.5 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="requestsPerHour"
                    className="mb-1.5 block text-[10px] font-medium text-[#C7C9CE] sm:mb-2 sm:text-sm"
                  >
                    Requests per hour
                  </label>
                  <input
                    id="requestsPerHour"
                    type="number"
                    defaultValue="10000"
                    className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 py-1.5 text-[11px] text-[#E8E6E1] outline-none transition focus:border-[#FF6A39] sm:px-4 sm:py-2.5 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4 sm:p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="text-base font-semibold text-[#E8E6E1] sm:text-lg">
                      Enterprise Plan
                    </h3>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-medium text-emerald-400 sm:px-2.5 sm:text-xs">
                      Active
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-[#8B8D94] sm:mt-1 sm:text-sm">
                    Unlimited workspaces • 10,000 emails/day • Priority support
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xl font-bold text-[#E8E6E1] sm:text-2xl">
                    $499
                    <span className="text-sm font-normal text-[#8B8D94]">
                      /month
                    </span>
                  </p>
                  <p className="text-[9px] text-[#8B8D94] sm:text-xs">
                    Next billing: Sep 15, 2026
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-[#2A2E37] pt-3 sm:mt-4 sm:gap-3 sm:pt-4">
                <button className="rounded-lg bg-[#FF6A39] px-3 py-1.5 text-[10px] font-medium text-white transition hover:bg-[#e85a2c] sm:px-4 sm:py-2 sm:text-sm">
                  Upgrade Plan
                </button>
                <button className="rounded-lg border border-[#2A2E37] px-3 py-1.5 text-[10px] font-medium text-[#C7C9CE] transition hover:bg-[#1B1E24] sm:px-4 sm:py-2 sm:text-sm">
                  Manage Subscription
                </button>
                <button className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-[10px] font-medium text-rose-400 transition hover:bg-rose-500/10 sm:px-4 sm:py-2 sm:text-sm">
                  Cancel Subscription
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3 sm:mb-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                    Payment Methods
                  </h4>
                  <p className="text-[9px] text-[#8B8D94] sm:text-xs">
                    Manage your payment methods
                  </p>
                </div>
                <button className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#FF6A39] px-2.5 py-1 text-[9px] font-medium text-white transition hover:bg-[#e85a2c] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
                  <Plus
                    size={10}
                    className="sm:h-[11px] sm:w-[11px] lg:h-[12px] lg:w-[12px]"
                  />
                  <span className="hidden xs:inline">Add Payment Method</span>
                  <span className="xs:hidden">Add</span>
                </button>
              </div>

              <div className="flex flex-col justify-between gap-2 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-2.5 sm:flex-row sm:items-center sm:p-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2A2E37] sm:h-10 sm:w-10">
                    <span className="text-sm font-bold text-[#E8E6E1] sm:text-base">
                      💳
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] text-[#E8E6E1] sm:text-sm">
                      Visa ending in 4242
                    </p>
                    <p className="text-[8px] text-[#8B8D94] sm:text-xs">
                      Expires 12/2026
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-medium text-emerald-400 sm:gap-1.5 sm:px-2 sm:text-[10px]">
                    <span className="h-1 w-1 rounded-full bg-emerald-400 sm:h-1.5 sm:w-1.5" />
                    <span className="hidden xs:inline">Default</span>
                    <span className="xs:hidden">D</span>
                  </span>
                  <button
                    className="text-[#8B8D94] transition hover:text-[#E8E6E1]"
                    aria-label="Edit payment method"
                  >
                    <Edit
                      size={12}
                      className="sm:h-[13px] sm:w-[13px] lg:h-[14px] lg:w-[14px]"
                    />
                  </button>
                  <button
                    className="text-[#8B8D94] transition hover:text-rose-400"
                    aria-label="Delete payment method"
                  >
                    <Trash2
                      size={12}
                      className="sm:h-[13px] sm:w-[13px] lg:h-[14px] lg:w-[14px]"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 sm:p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3 sm:mb-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] font-medium text-[#E8E6E1] sm:text-sm">
                    Billing History
                  </h4>
                  <p className="text-[9px] text-[#8B8D94] sm:text-xs">
                    Recent invoices and payments
                  </p>
                </div>
                <button className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#2A2E37] px-2.5 py-1 text-[9px] font-medium text-[#C7C9CE] transition hover:bg-[#1B1E24] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
                  <Download
                    size={10}
                    className="sm:h-[11px] sm:w-[11px] lg:h-[12px] lg:w-[12px]"
                  />
                  <span className="hidden xs:inline">Export All</span>
                  <span className="xs:hidden">Export</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col justify-between gap-2 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-2.5 sm:flex-row sm:items-center sm:p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[10px] text-[#E8E6E1] sm:text-sm">
                      Invoice #INV-2026-001
                    </p>
                    <p className="text-[8px] text-[#8B8D94] sm:text-xs">
                      Aug 15, 2026
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <span className="text-[10px] font-medium text-[#E8E6E1] sm:text-sm">
                      $499.00
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-medium text-emerald-400 sm:gap-1.5 sm:px-2 sm:text-[10px]">
                      <CheckCircle2
                        size={9}
                        className="sm:h-[10px] sm:w-[10px] lg:h-[10px] lg:w-[10px]"
                      />
                      <span className="hidden xs:inline">Paid</span>
                      <span className="xs:hidden">✓</span>
                    </span>
                    <button
                      className="text-[#8B8D94] transition hover:text-[#E8E6E1]"
                      aria-label="Download invoice"
                    >
                      <Download
                        size={12}
                        className="sm:h-[13px] sm:w-[13px] lg:h-[14px] lg:w-[14px]"
                      />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-2 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-2.5 sm:flex-row sm:items-center sm:p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[10px] text-[#E8E6E1] sm:text-sm">
                      Invoice #INV-2026-000
                    </p>
                    <p className="text-[8px] text-[#8B8D94] sm:text-xs">
                      Jul 15, 2026
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <span className="text-[10px] font-medium text-[#E8E6E1] sm:text-sm">
                      $499.00
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-medium text-emerald-400 sm:gap-1.5 sm:px-2 sm:text-[10px]">
                      <CheckCircle2
                        size={9}
                        className="sm:h-[10px] sm:w-[10px] lg:h-[10px] lg:w-[10px]"
                      />
                      <span className="hidden xs:inline">Paid</span>
                      <span className="xs:hidden">✓</span>
                    </span>
                    <button
                      className="text-[#8B8D94] transition hover:text-[#E8E6E1]"
                      aria-label="Download invoice"
                    >
                      <Download
                        size={12}
                        className="sm:h-[13px] sm:w-[13px] lg:h-[14px] lg:w-[14px]"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 sm:p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center md:gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] font-semibold text-rose-400 sm:text-sm">
                    Delete Platform
                  </h4>
                  <p className="text-[9px] text-rose-300 sm:text-xs">
                    Permanently delete the entire platform and all associated
                    data. This action cannot be undone.
                  </p>
                </div>
                <button className="shrink-0 rounded-lg border border-rose-500/30 px-3 py-1.5 text-[10px] font-medium text-rose-400 transition hover:bg-rose-500/10 sm:px-4 sm:py-2 sm:text-sm">
                  <AlertTriangle
                    size={12}
                    className="mr-1 inline sm:mr-2 sm:h-[13px] sm:w-[13px] lg:h-[14px] lg:w-[14px]"
                  />
                  Delete Platform
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0E1013]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .main-content::-webkit-scrollbar {
          width: 6px;
        }
        .main-content::-webkit-scrollbar-track {
          background: #0E1013;
        }
        .main-content::-webkit-scrollbar-thumb {
          background: #2A2E37;
          border-radius: 3px;
        }
        .main-content::-webkit-scrollbar-thumb:hover {
          background: #3A3F4A;
        }
        .section-nav-item {
          transition: all 0.15s ease;
        }
        .section-nav-item:hover {
          background-color: #1B1E24;
        }
        .section-nav-item.active {
          background-color: rgba(255,106,57,0.12);
          color: #FF6A39;
        }
        .sidebar-overlay {
          animation: fadeIn 0.2s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .sidebar-slide {
          animation: slideIn 0.25s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 480px) {
          .settings-nav {
            display: flex;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding: 4px;
            gap: 4px;
          }
          .settings-nav::-webkit-scrollbar {
            height: 2px;
          }
          .settings-nav::-webkit-scrollbar-thumb {
            background: #2A2E37;
            border-radius: 2px;
          }
          .settings-nav .section-nav-item {
            white-space: nowrap;
            flex-shrink: 0;
            padding: 8px 12px;
          }
        }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 sidebar-overlay bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 z-50 h-screen shrink-0 transition-transform duration-200 ease-out lg:sticky
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
          sidebar-slide
        `}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="main-content h-screen w-full flex-1 overflow-y-auto bg-[#0E1013] p-3 sm:p-4 lg:p-6 xl:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-[#2A2E37] bg-[#171A21] p-2 text-[#C7C9CE] transition-colors hover:bg-[#1B1E24] lg:hidden"
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-[#E8E6E1] sm:text-2xl lg:text-3xl">
                  Settings
                </h1>
                <span className="rounded-full bg-[#FF6A39]/15 px-2 py-0.5 text-[9px] font-medium text-[#FF6A39] sm:px-2.5 sm:text-[10px] lg:text-[11px]">
                  Admin
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-[#8B8D94] sm:mt-1 sm:text-xs lg:text-sm">
                Configure platform settings and preferences.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveChanges}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#FF6A39] px-3 py-1.5 text-[10px] font-medium text-white shadow-lg shadow-[#FF6A39]/20 transition hover:bg-[#e85a2c] sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs lg:text-sm"
          >
            <Save
              size={14}
              className="sm:h-[15px] sm:w-[15px] lg:h-[16px] lg:w-[16px]"
            />
            Save Changes
          </button>
        </div>

        {/* Settings Layout */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar Navigation - Responsive */}
          <div className="rounded-xl border border-[#2A2E37] bg-[#171A21] p-1.5 sm:p-2">
            <div className="settings-nav flex gap-0.5 overflow-x-auto sm:gap-1 lg:flex-col">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`section-nav-item flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-medium transition sm:gap-3 sm:px-3 sm:py-2.5 sm:text-sm ${
                      isActive ? "active" : "text-[#C7C9CE]"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={`sm:h-[15px] sm:w-[15px] lg:h-[16px] lg:w-[16px] ${
                        isActive ? "text-[#FF6A39]" : "text-[#8B8D94]"
                      }`}
                    />
                    <span className="hidden sm:inline">{section.label}</span>
                    <span className="sm:hidden">
                      {section.label.substring(0, 4)}
                    </span>
                    {section.id === "api" && (
                      <span className="ml-auto rounded-full bg-[#FF6A39]/15 px-1.5 py-0.5 text-[8px] font-medium text-[#FF6A39] sm:px-2 sm:text-[10px]">
                        v2
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Content */}
          <div className="rounded-xl border border-[#2A2E37] bg-[#171A21] p-3 sm:p-4 lg:p-6">
            {renderSection()}
          </div>
        </div>
      </main>
    </div>
  );
};

// Add missing Users import for AdminSidebar
import { Users } from "lucide-react";

export default AdminSettings;