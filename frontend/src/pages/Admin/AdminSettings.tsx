import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Settings,
  Save,
  Globe,
  Mail,
  Shield,
  Bell,
  Key,
  Database,
  Users,
  Zap,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Server,
  Link,
  Eye,
  EyeOff,
  Copy,
  Check,
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

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const smtpConfigs: SMTPConfig[] = [
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
];

const settingsSections = [
  { id: "general", label: "General", icon: Settings },
  { id: "smtp", label: "SMTP Configuration", icon: Mail },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "api", label: "API & Webhooks", icon: Key },
  { id: "billing", label: "Billing", icon: DollarSign },
];

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminSettings = () => {
  const [activeSection, setActiveSection] = useState("general");
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyApiKey = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addIpToWhitelist = () => {
    if (newIp && !ipWhitelist.includes(newIp)) {
      setIpWhitelist([...ipWhitelist, newIp]);
      setNewIp("");
    }
  };

  const removeIpFromWhitelist = (ip: string) => {
    setIpWhitelist(ipWhitelist.filter((i) => i !== ip));
  };

  const getStatusBadge = (status: SMTPConfig["status"]) => {
    const styles = {
      Active: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
      Inactive: { bg: "bg-slate-500/15", text: "text-slate-400" },
      Error: { bg: "bg-rose-500/15", text: "text-rose-400" },
    };
    const s = styles[status];
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${s.bg} ${s.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${
          status === "Active" ? "bg-emerald-400" :
          status === "Inactive" ? "bg-slate-400" :
          "bg-rose-400"
        }`} />
        {status}
      </span>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">Platform Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
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
                <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">Date Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#E8E6E1]">SMTP Configurations</h3>
                <p className="text-xs text-[#8B8D94]">Manage your SMTP server configurations</p>
              </div>
              <button className="flex items-center gap-2 rounded-lg bg-[#FF6A39] px-4 py-2 text-sm font-medium text-white hover:bg-[#e85a2c] transition">
                <Plus size={14} />
                Add SMTP
              </button>
            </div>

            <div className="space-y-3">
              {smtpConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-medium text-[#E8E6E1]">{config.name}</h4>
                      {getStatusBadge(config.status)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8B8D94]">
                      <span>Host: {config.host}</span>
                      <span>Port: {config.port}</span>
                      <span>Encryption: {config.encryption}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-lg border border-[#2A2E37] px-3 py-1.5 text-xs font-medium text-[#C7C9CE] hover:bg-[#1B1E24] transition">
                      <Edit size={12} className="inline mr-1" />
                      Edit
                    </button>
                    <button className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition">
                      <Trash2 size={12} className="inline mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <div>
                <h4 className="text-sm font-medium text-[#E8E6E1]">Two-Factor Authentication</h4>
                <p className="text-xs text-[#8B8D94]">Require 2FA for all admin accounts</p>
              </div>
              <button
                onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                className={`relative h-6 w-11 rounded-full transition ${
                  twoFactorAuth ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    twoFactorAuth ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Session Timeout */}
            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <h4 className="text-sm font-medium text-[#E8E6E1]">Session Timeout</h4>
              <p className="text-xs text-[#8B8D94] mb-3">Auto-logout after inactivity</p>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
              </select>
            </div>

            {/* Password Policy */}
            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <h4 className="text-sm font-medium text-[#E8E6E1]">Password Policy</h4>
              <p className="text-xs text-[#8B8D94] mb-3">Password complexity requirements</p>
              <select
                value={passwordPolicy}
                onChange={(e) => setPasswordPolicy(e.target.value)}
                className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
              >
                <option value="basic">Basic (min 8 characters)</option>
                <option value="medium">Medium (8+ chars, 1 uppercase, 1 number)</option>
                <option value="strict">Strict (12+ chars, upper, lower, number, symbol)</option>
              </select>
            </div>

            {/* IP Whitelist */}
            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <h4 className="text-sm font-medium text-[#E8E6E1]">IP Whitelist</h4>
              <p className="text-xs text-[#8B8D94] mb-3">Restrict admin access to specific IPs</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="Enter IP address"
                  className="flex-1 rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                />
                <button
                  onClick={addIpToWhitelist}
                  className="rounded-lg bg-[#FF6A39] px-4 py-2 text-sm font-medium text-white hover:bg-[#e85a2c] transition"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ipWhitelist.map((ip) => (
                  <span
                    key={ip}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#2A2E37] px-3 py-1 text-xs text-[#C7C9CE]"
                  >
                    {ip}
                    <button
                      onClick={() => removeIpFromWhitelist(ip)}
                      className="text-[#8B8D94] hover:text-[#E8E6E1] transition"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {ipWhitelist.length === 0 && (
                  <span className="text-xs text-[#8B8D94]">No IPs whitelisted</span>
                )}
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <div>
                <h4 className="text-sm font-medium text-[#E8E6E1]">Campaign Notifications</h4>
                <p className="text-xs text-[#8B8D94]">Campaign completion and failure alerts</p>
              </div>
              <button
                onClick={() => setNotifCampaigns(!notifCampaigns)}
                className={`relative h-6 w-11 rounded-full transition ${
                  notifCampaigns ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    notifCampaigns ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <div>
                <h4 className="text-sm font-medium text-[#E8E6E1]">System Notifications</h4>
                <p className="text-xs text-[#8B8D94]">System health and maintenance alerts</p>
              </div>
              <button
                onClick={() => setNotifSystem(!notifSystem)}
                className={`relative h-6 w-11 rounded-full transition ${
                  notifSystem ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    notifSystem ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <div>
                <h4 className="text-sm font-medium text-[#E8E6E1]">Security Alerts</h4>
                <p className="text-xs text-[#8B8D94]">Security incidents and login alerts</p>
              </div>
              <button
                onClick={() => setNotifSecurity(!notifSecurity)}
                className={`relative h-6 w-11 rounded-full transition ${
                  notifSecurity ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    notifSecurity ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <div>
                <h4 className="text-sm font-medium text-[#E8E6E1]">Billing Notifications</h4>
                <p className="text-xs text-[#8B8D94]">Invoices, payments, and subscription alerts</p>
              </div>
              <button
                onClick={() => setNotifBilling(!notifBilling)}
                className={`relative h-6 w-11 rounded-full transition ${
                  notifBilling ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    notifBilling ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <div>
                <h4 className="text-sm font-medium text-[#E8E6E1]">Weekly Digest</h4>
                <p className="text-xs text-[#8B8D94]">Weekly summary of platform activity</p>
              </div>
              <button
                onClick={() => setNotifWeeklyDigest(!notifWeeklyDigest)}
                className={`relative h-6 w-11 rounded-full transition ${
                  notifWeeklyDigest ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    notifWeeklyDigest ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <div>
                <h4 className="text-sm font-medium text-[#E8E6E1]">Email Digest</h4>
                <p className="text-xs text-[#8B8D94]">Receive notifications via email</p>
              </div>
              <button
                onClick={() => setEmailDigest(!emailDigest)}
                className={`relative h-6 w-11 rounded-full transition ${
                  emailDigest ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    emailDigest ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        );

      case "api":
        return (
          <div className="space-y-6">
            {/* API Key */}
            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <h4 className="text-sm font-medium text-[#E8E6E1]">API Key</h4>
              <p className="text-xs text-[#8B8D94] mb-3">Use this key to authenticate API requests</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5">
                    <span className="text-sm font-mono text-[#C7C9CE]">
                      {showApiKey ? "mf_live_9f2a1c7e4b8d3f6091a2c4e" : "••••••••••••••••••••••••"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="rounded-lg border border-[#2A2E37] p-2.5 text-[#8B8D94] hover:bg-[#1B1E24] transition"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={handleCopyApiKey}
                  className="rounded-lg border border-[#2A2E37] p-2.5 text-[#8B8D94] hover:bg-[#1B1E24] transition"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
                <button className="rounded-lg border border-[#2A2E37] p-2.5 text-[#8B8D94] hover:bg-[#1B1E24] transition">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Webhooks */}
            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-[#E8E6E1]">Webhooks</h4>
                  <p className="text-xs text-[#8B8D94]">Configure webhook endpoints for events</p>
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-[#FF6A39] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#e85a2c] transition">
                  <Plus size={12} />
                  Add Webhook
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3">
                  <div>
                    <p className="text-sm text-[#E8E6E1]">Campaign Events</p>
                    <p className="text-xs text-[#8B8D94]">https://api.company.com/webhooks/campaign</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                    <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition">
                      <Edit size={14} />
                    </button>
                    <button className="text-[#8B8D94] hover:text-rose-400 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3">
                  <div>
                    <p className="text-sm text-[#E8E6E1]">System Events</p>
                    <p className="text-xs text-[#8B8D94]">https://api.company.com/webhooks/system</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-500/15 text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Inactive
                    </span>
                    <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition">
                      <Edit size={14} />
                    </button>
                    <button className="text-[#8B8D94] hover:text-rose-400 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* API Rate Limits */}
            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <h4 className="text-sm font-medium text-[#E8E6E1]">API Rate Limits</h4>
              <p className="text-xs text-[#8B8D94] mb-3">Configure API request limits</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">Requests per minute</label>
                  <input
                    type="number"
                    defaultValue="1000"
                    className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">Requests per hour</label>
                  <input
                    type="number"
                    defaultValue="10000"
                    className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            {/* Plan Overview */}
            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-[#E8E6E1]">Enterprise Plan</h3>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-[#8B8D94] mt-1">Unlimited workspaces • 10,000 emails/day • Priority support</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#E8E6E1]">$499<span className="text-sm font-normal text-[#8B8D94]">/month</span></p>
                  <p className="text-xs text-[#8B8D94]">Next billing: Sep 15, 2026</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2A2E37] flex flex-wrap gap-3">
                <button className="rounded-lg bg-[#FF6A39] px-4 py-2 text-sm font-medium text-white hover:bg-[#e85a2c] transition">
                  Upgrade Plan
                </button>
                <button className="rounded-lg border border-[#2A2E37] px-4 py-2 text-sm font-medium text-[#C7C9CE] hover:bg-[#1B1E24] transition">
                  Manage Subscription
                </button>
                <button className="rounded-lg border border-rose-500/30 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition">
                  Cancel Subscription
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-[#E8E6E1]">Payment Methods</h4>
                  <p className="text-xs text-[#8B8D94]">Manage your payment methods</p>
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-[#FF6A39] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#e85a2c] transition">
                  <Plus size={12} />
                  Add Payment Method
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2A2E37]">
                    <span className="text-sm font-bold text-[#E8E6E1]">💳</span>
                  </div>
                  <div>
                    <p className="text-sm text-[#E8E6E1]">Visa ending in 4242</p>
                    <p className="text-xs text-[#8B8D94]">Expires 12/2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Default
                  </span>
                  <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition">
                    <Edit size={14} />
                  </button>
                  <button className="text-[#8B8D94] hover:text-rose-400 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Billing History */}
            <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-[#E8E6E1]">Billing History</h4>
                  <p className="text-xs text-[#8B8D94]">Recent invoices and payments</p>
                </div>
                <button className="flex items-center gap-2 rounded-lg border border-[#2A2E37] px-3 py-1.5 text-xs font-medium text-[#C7C9CE] hover:bg-[#1B1E24] transition">
                  <Download size={12} />
                  Export All
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3">
                  <div>
                    <p className="text-sm text-[#E8E6E1]">Invoice #INV-2026-001</p>
                    <p className="text-xs text-[#8B8D94]">Aug 15, 2026</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-[#E8E6E1]">$499.00</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-emerald-400">
                      <CheckCircle2 size={10} />
                      Paid
                    </span>
                    <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition">
                      <Download size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3">
                  <div>
                    <p className="text-sm text-[#E8E6E1]">Invoice #INV-2026-000</p>
                    <p className="text-xs text-[#8B8D94]">Jul 15, 2026</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-[#E8E6E1]">$499.00</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-emerald-400">
                      <CheckCircle2 size={10} />
                      Paid
                    </span>
                    <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition">
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-rose-400">Delete Platform</h4>
                  <p className="text-xs text-rose-300">
                    Permanently delete the entire platform and all associated data. This action cannot be undone.
                  </p>
                </div>
                <button className="rounded-lg border border-rose-500/30 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition">
                  <AlertTriangle size={14} className="inline mr-2" />
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
      `}</style>

      {/* Sidebar */}
      <div className="sticky top-0 h-screen flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <main className="main-content flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#0E1013] h-screen">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#E8E6E1] font-['Space_Grotesk']">
                Settings
              </h1>
              <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39]">
                Admin
              </span>
            </div>
            <p className="mt-1 text-xs md:text-sm text-[#8B8D94]">
              Configure platform settings and preferences.
            </p>
          </div>

          <button className="flex items-center gap-2 rounded-lg bg-[#FF6A39] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#FF6A39]/20 hover:bg-[#e85a2c] transition">
            <Save size={16} />
            Save Changes
          </button>
        </div>

        {/* Settings Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar Navigation */}
          <div className="rounded-xl border border-[#2A2E37] bg-[#171A21] p-2">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`section-nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? "active" : "text-[#C7C9CE]"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-[#FF6A39]" : "text-[#8B8D94]"} />
                  {section.label}
                  {section.id === "api" && (
                    <span className="ml-auto rounded-full bg-[#FF6A39]/15 px-2 py-0.5 text-[10px] font-medium text-[#FF6A39]">
                      v2
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Settings Content */}
          <div className="rounded-xl border border-[#2A2E37] bg-[#171A21] p-4 md:p-6">
            {renderSection()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;