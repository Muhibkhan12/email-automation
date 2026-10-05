const MicrosoftLogo = () => (
  <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden>
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

const AddAccountModal = ({ onClose }: { onClose: () => void }) => {
  const ctx = useContext(SenderAccContext);
  const ms = useMicrosoftConnect();

  const [provider, setProvider] = useState<Provider>("Outlook");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [dailyLimit, setDailyLimit] = useState("500");
  const [hourlyLimit, setHourlyLimit] = useState("50");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOutlook = provider === "Outlook";
  const busy = saving || ms.connecting;
  const shownError = error ?? ms.error;

  const refreshAccounts = async () => {
    // Use whatever your context exposes to re-fetch the list.
    // Adjust the name to match SenderAccountsContext.
    const c = ctx as any;
    await (c?.fetchSenderAccounts ?? c?.refreshSenderAccounts ?? (async () => {}))();
  };

  const handleMicrosoft = async () => {
    setError(null);
    try {
      await ms.connect({
        displayName: name.trim() || undefined,
        dailyLimit: Number(dailyLimit) || 0,
        hourlyLimit: Number(hourlyLimit) || 0,
      });
      await refreshAccounts();
      onClose();
    } catch {
      /* error text is already in ms.error */
    }
  };

  const handleManual = async () => {
    if (!ctx) return;
    const payload: CreateSenderAccountInput = {
      display_name: name.trim(),
      email: email.trim(),
      provider,
      daily_limit: Number(dailyLimit) || 0,
      hourly_limit: Number(hourlyLimit) || 0,
    };
    try {
      setSaving(true);
      setError(null);
      await ctx.addSenderAccount(payload);
      onClose();
    } catch (err) {
      console.error("Failed to add sender account:", err);
      setError("Could not connect this account. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputBase = "w-full rounded-2xl px-4 py-2.5 text-[13px] outline-none transition-all";
  const inputStyle: React.CSSProperties = {
    background: "#0F131C",
    color: "#E8E6E1",
    boxShadow: "inset 0 0 0 1px #1A1F2B",
  };
  const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(255,106,57,0.55), 0 0 0 4px rgba(255,106,57,0.10)");
  const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.boxShadow = "inset 0 0 0 1px #1A1F2B");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl overflow-hidden float-in"
        style={{ background: "#141823", boxShadow: "inset 0 0 0 1px #232938, 0 30px 60px -20px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 md:p-6 border-b border-[#1A1F2B]">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,106,57,0.10)", boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)" }}
            >
              <Mail size={18} className="text-[#FF6A39]" />
            </div>
            <div className="min-w-0">
              <h2
                style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }}
                className="text-[16px] md:text-[18px] font-bold text-white truncate"
              >
                Add sender account
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: "#8A90A0" }}>
                Connect an account for sending campaigns.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="shrink-0 p-2 rounded-2xl text-[#8A90A0] hover:text-[#E8E6E1] transition-colors disabled:opacity-50"
            style={{ background: "#0F131C", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <Field label="Provider">
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as Provider);
                setError(null);
                ms.clearError();
              }}
              disabled={busy}
              className={inputBase}
              style={inputStyle}
              onFocus={focusIn}
              onBlur={focusOut}
            >
              <option>Outlook</option>
              <option>Gmail</option>
              <option>Custom SMTP</option>
            </select>
          </Field>

          {isOutlook ? (
            <>
              <div
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: "#0F131C", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
              >
                <MicrosoftLogo />
                <p className="text-[12px] leading-5" style={{ color: "#8A90A0" }}>
                  You'll sign in with Microsoft in a pop-up. We only request permission to send mail and read
                  your basic profile — your password is never shared with us.
                </p>
              </div>

              <Field label="Display name (optional)">
                <input
                  type="text"
                  placeholder="Defaults to your Microsoft profile name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputBase}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Email address">
                <input
                  type="email"
                  placeholder="marketing@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputBase}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
              </Field>
              <Field label="Display name">
                <input
                  type="text"
                  placeholder="Marketing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputBase}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
              </Field>
            </>
          )}

          <div
            className="grid grid-cols-2 gap-3 rounded-2xl p-4"
            style={{ background: "#0F131C", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
          >
            <Field label="Daily limit" compact>
              <input
                type="number" min={0} placeholder="500"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className={inputBase}
                style={{ ...inputStyle, background: "#141823" }}
                onFocus={focusIn}
                onBlur={focusOut}
              />
            </Field>
            <Field label="Hourly limit" compact>
              <input
                type="number" min={0} placeholder="50"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                className={inputBase}
                style={{ ...inputStyle, background: "#141823" }}
                onFocus={focusIn}
                onBlur={focusOut}
              />
            </Field>
          </div>

          {shownError && (
            <div
              className="flex items-start gap-2 rounded-2xl px-3.5 py-2.5"
              style={{ background: "rgba(248,113,113,0.08)", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}
            >
              <AlertTriangle size={14} className="text-[#F87171] shrink-0 mt-0.5" />
              <p className="text-[12px]" style={{ color: "#F87171" }}>{shownError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 md:p-6 border-t border-[#1A1F2B]">
          <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
            credentials encrypted at rest
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={busy}
              className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors disabled:opacity-50"
              style={{ background: "#0F131C", color: "#DADEE7", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
            >
              Cancel
            </button>

            {isOutlook ? (
              <button
                onClick={handleMicrosoft}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[12.5px] font-semibold text-white transition-all disabled:opacity-60 disabled:hover:translate-y-0 hover:-translate-y-0.5"
                style={{ background: "#FF6A39", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
              >
                {ms.connecting ? (
                  <><Loader2 size={14} className="spin" /> Waiting for Microsoft…</>
                ) : (
                  <><MicrosoftLogo /> Sign in with Microsoft</>
                )}
              </button>
            ) : (
              <button
                onClick={handleManual}
                disabled={busy || !email || !name}
                className="rounded-2xl px-5 py-2.5 text-[12.5px] font-semibold text-white transition-all disabled:opacity-50 disabled:hover:translate-y-0 hover:-translate-y-0.5"
                style={{ background: "#FF6A39", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
              >
                {saving ? "Connecting…" : "Connect account"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};