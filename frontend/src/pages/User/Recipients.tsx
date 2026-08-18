import React, { useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Search, UserPlus, UploadCloud, Users, MailCheck, MailX, MailWarning,
  ChevronLeft, ChevronRight, Trash2, Tag as TagIcon, MoreVertical,
} from "lucide-react";

type RecipientStatus = "Subscribed" | "Unsubscribed" | "Bounced";

interface Recipient {
  id: string;
  name: string;
  email: string;
  tags: string[];
  status: RecipientStatus;
  opens: number;
  addedOn: string;
}

const recipients: Recipient[] = [
  { id: "r1", name: "Sara Khan", email: "sara.khan@nimbus.io", tags: ["Customer", "VIP"], status: "Subscribed", opens: 24, addedOn: "Jul 12, 2026" },
  { id: "r2", name: "Omar Malik", email: "omar.malik@venturehub.co", tags: ["Lead"], status: "Subscribed", opens: 9, addedOn: "Jul 15, 2026" },
  { id: "r3", name: "Hina Raza", email: "hina.raza@brightpath.org", tags: ["Customer"], status: "Subscribed", opens: 41, addedOn: "Jun 30, 2026" },
  { id: "r4", name: "Devon Blake", email: "devon@stackline.app", tags: ["Beta Tester"], status: "Subscribed", opens: 6, addedOn: "Aug 1, 2026" },
  { id: "r5", name: "Liam O'Connor", email: "liam.oconnor@forgeworks.com", tags: ["Lead", "Newsletter"], status: "Bounced", opens: 0, addedOn: "May 22, 2026" },
  { id: "r6", name: "Zainab Qureshi", email: "zainab.q@meridiancorp.net", tags: ["Customer"], status: "Unsubscribed", opens: 14, addedOn: "Apr 9, 2026" },
  { id: "r7", name: "Priya Nair", email: "priya.nair@lumenstack.io", tags: ["VIP", "Newsletter"], status: "Subscribed", opens: 33, addedOn: "Jul 28, 2026" },
  { id: "r8", name: "Ahmed Farooq", email: "ahmed.f@driftlabs.dev", tags: ["Lead"], status: "Subscribed", opens: 3, addedOn: "Aug 5, 2026" },
];

const STATUS_META: Record<RecipientStatus, { bg: string; fg: string; icon: React.ElementType }> = {
  Subscribed: { bg: "bg-emerald-50", fg: "text-emerald-700", icon: MailCheck },
  Unsubscribed: { bg: "bg-gray-100", fg: "text-gray-600", icon: MailX },
  Bounced: { bg: "bg-red-50", fg: "text-red-600", icon: MailWarning },
};

const FILTERS: ("All" | RecipientStatus)[] = ["All", "Subscribed", "Unsubscribed", "Bounced"];

const summary = [
  { label: "Total recipients", value: "34,920", icon: Users, tint: "sky" },
  { label: "Subscribed", value: "32,140", icon: MailCheck, tint: "emerald" },
  { label: "Unsubscribed", value: "1,940", icon: MailX, tint: "gray" },
  { label: "Bounced", value: "840", icon: MailWarning, tint: "red" },
];

const tintClasses: Record<string, { bg: string; fg: string }> = {
  sky: { bg: "bg-sky-50", fg: "text-sky-600" },
  emerald: { bg: "bg-emerald-50", fg: "text-emerald-600" },
  gray: { bg: "bg-gray-100", fg: "text-gray-500" },
  red: { bg: "bg-red-50", fg: "text-red-600" },
};

const Recipients = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | RecipientStatus>("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return recipients.filter((r) => {
      const matchesFilter = filter === "All" || r.status === filter;
      const matchesQuery =
        !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0B0E12]">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        
        /* Custom scrollbar */
        .main-content::-webkit-scrollbar {
          width: 6px;
        }
        .main-content::-webkit-scrollbar-track {
          background: #0B0E12;
        }
        .main-content::-webkit-scrollbar-thumb {
          background: #2A2E37;
          border-radius: 3px;
        }
        .main-content::-webkit-scrollbar-thumb:hover {
          background: #3A3F4A;
        }
      `}</style>

      {/* Sidebar - sticky */}
      <div className="sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="main-content flex-1 overflow-y-auto p-3 md:p-6 lg:p-8 bg-[#12151B] h-screen">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 md:mb-7">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#E8E6E1] tracking-tight">
              Recipients
            </h1>
            <p className="mt-1 text-xs md:text-sm text-[#9BA0A8]">Manage everyone who receives your campaigns.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-2.5 w-full sm:w-auto">
            <button className="flex items-center justify-center gap-1.5 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#12151B] px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium text-[#C7C9CE] hover:bg-[#1B1E24] hover:text-[#E8E6E1] transition-colors flex-1 sm:flex-none">
              <UploadCloud size={14} />
              Import CSV
            </button>
            <button className="flex items-center justify-center gap-1.5 md:gap-2 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium text-white shadow-sm hover:bg-[#e85a2c] transition-colors flex-1 sm:flex-none" style={{ background: "#FF6A39", boxShadow: "0 4px 12px rgba(255,106,57,0.25)" }}>
              <UserPlus size={14} />
              Add Recipient
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-4 md:mb-6">
          {summary.map((s) => {
            const t = tintClasses[s.tint];
            const Icon = s.icon;
            const isEmber = s.tint === "sky"; 
            return (
              <div key={s.label} className="rounded-xl border border-[#2A2E37] bg-[#12151B] p-3 md:p-5 shadow-sm">
                <div className={`w-7 h-7 md:w-9 md:h-9 rounded-lg flex items-center justify-center mb-2 md:mb-3 ${isEmber ? "bg-[#FF6A39]/20" : t.bg}`}>
                  <Icon size={14} className={isEmber ? "text-[#FF6A39]" : t.fg} />
                </div>
                <p className="text-xl md:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-mono">
                  {s.value}
                </p>
                <p className="text-[10px] md:text-[13px] mt-0.5 md:mt-1 text-[#9BA0A8]">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-3 md:mb-4">
          <div className="flex items-center gap-2 rounded-lg border border-[#2A2E37] bg-[#12151B] px-2 md:px-3 py-1.5 md:py-2 flex-1 min-w-[180px]">
            <Search size={14} className="text-[#6B727C]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or tag…"
              className="w-full bg-transparent text-xs md:text-sm outline-none text-[#E8E6E1] placeholder:text-[#6B727C]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-medium transition-colors border ${
                  filter === f 
                    ? "bg-[#FF6A39] text-white border-[#FF6A39]" 
                    : "bg-[#12151B] text-[#C7C9CE] border-[#2A2E37] hover:bg-[#1B1E24] hover:text-[#E8E6E1]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {selected.size > 0 && (
            <button className="flex items-center gap-1.5 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-medium transition-colors hover:bg-[#FF6A39]/20 border border-[#FF6A39]/20 bg-[#FF6A39]/10 text-[#FF6A39]">
              <Trash2 size={12} />
              Remove {selected.size} selected
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between px-3 md:px-5 py-3 md:py-4 border-b border-[#2A2E37] gap-2">
            <h2 className="text-xs md:text-sm font-semibold text-[#E8E6E1]">
              {filtered.length} {filtered.length === 1 ? "recipient" : "recipients"}
            </h2>
            <span className="text-[9px] md:text-[11px] text-[#6B727C] font-mono">synced live</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="text-[9px] md:text-[11px] uppercase tracking-wider text-[#6B727C]">
                  <th className="px-3 md:px-5 py-2 md:py-2.5 font-medium w-10">
                    <input 
                      type="checkbox" 
                      checked={allSelected} 
                      onChange={toggleAll} 
                      className="rounded border-[#2A2E37] bg-[#12151B] accent-[#FF6A39]"
                    />
                  </th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 font-medium">Name</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 font-medium">Tags</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 font-medium">Status</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 font-medium">Opens</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 font-medium">Added</th>
                  <th className="px-3 md:px-5 py-2 md:py-2.5 font-medium w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 md:px-5 py-8 md:py-12 text-center text-xs md:text-sm text-[#6B727C]">
                      No recipients match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const meta = STATUS_META[r.status];
                    const StatusIcon = meta.icon;
                    const isHovered = hoveredRowId === r.id;
                    
                    const statusColors = {
                      Subscribed: { bg: "rgba(16,185,129,0.15)", fg: "#34D399" },
                      Unsubscribed: { bg: "rgba(107,114,128,0.15)", fg: "#9CA3AF" },
                      Bounced: { bg: "rgba(239,68,68,0.15)", fg: "#F87171" },
                    };
                    
                    return (
                      <tr 
                        key={r.id} 
                        className={`border-t border-[#2A2E37] transition-colors ${isHovered ? "bg-[#1B1E24]" : ""}`}
                        onMouseEnter={() => setHoveredRowId(r.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                      >
                        <td className="px-3 md:px-5 py-2 md:py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(r.id)}
                            onChange={() => toggleOne(r.id)}
                            className="rounded border-[#2A2E37] bg-[#12151B] accent-[#FF6A39]"
                          />
                        </td>
                        <td className="px-2 md:px-3 py-2 md:py-3">
                          <p className="text-[11px] md:text-[13.5px] font-medium" style={{ color: isHovered ? "#E8E6E1" : "#D1D5DB" }}>
                            {r.name}
                          </p>
                          <p className="text-[9px] md:text-[12px] text-[#6B727C]">{r.email}</p>
                        </td>
                        <td className="px-2 md:px-3 py-2 md:py-3">
                          <div className="flex flex-wrap gap-1 md:gap-1.5">
                            {r.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-0.5 md:gap-1 rounded-full px-1 md:px-2 py-0.5 text-[8px] md:text-[11px] font-medium"
                                style={{ backgroundColor: "rgba(255,106,57,0.12)", color: "#FF6A39" }}
                              >
                                <TagIcon size={8} />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 md:px-3 py-2 md:py-3">
                          <span 
                            className="inline-flex items-center gap-0.5 md:gap-1 rounded-full px-1.5 md:px-2 py-0.5 text-[8px] md:text-[11.5px] font-medium whitespace-nowrap"
                            style={{ backgroundColor: statusColors[r.status].bg, color: statusColors[r.status].fg }}
                          >
                            <StatusIcon size={9} />
                            {r.status}
                          </span>
                        </td>
                        <td className="px-2 md:px-3 py-2 md:py-3 text-[10px] md:text-[13px] font-mono text-[#9BA0A8]">
                          {r.opens}
                        </td>
                        <td className="px-2 md:px-3 py-2 md:py-3 text-[9px] md:text-[12.5px] whitespace-nowrap text-[#6B727C]">{r.addedOn}</td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-right">
                          <button className={`transition-colors ${isHovered ? "text-[#E8E6E1]" : "text-[#6B727C]"} hover:text-[#E8E6E1]`}>
                            <MoreVertical size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between px-3 md:px-5 py-2 md:py-3 border-t border-[#2A2E37] gap-2">
            <span className="text-[9px] md:text-xs text-[#6B727C]">Showing {filtered.length} of 34,920</span>
            <div className="flex items-center gap-1 md:gap-1.5">
              <button className="w-6 h-6 md:w-7 md:h-7 rounded-lg border border-[#2A2E37] bg-[#12151B] flex items-center justify-center text-[#6B727C] hover:bg-[#1B1E24] hover:text-[#E8E6E1] transition-colors">
                <ChevronLeft size={12} />
              </button>
              <span className="px-1 md:px-2 text-[10px] md:text-[13px] font-mono text-[#C7C9CE]">1 / 4,366</span>
              <button className="w-6 h-6 md:w-7 md:h-7 rounded-lg border border-[#2A2E37] bg-[#12151B] flex items-center justify-center text-[#C7C9CE] hover:bg-[#1B1E24] hover:text-[#E8E6E1] transition-colors">
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Recipients;