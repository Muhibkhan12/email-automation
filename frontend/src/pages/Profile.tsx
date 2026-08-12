import { useState } from "react";
import Sidebar from "./Sidebar";

interface SenderAccount {
  email: string;
  provider: string;
  status: "Active" | "Disconnected";
  sent: number;
}

const senderAccounts: SenderAccount[] = [
  {
    email: "marketing@company.com",
    provider: "Gmail SMTP",
    status: "Active",
    sent: 18420,
  },
  {
    email: "sales@company.com",
    provider: "Outlook SMTP",
    status: "Active",
    sent: 15830,
  },
  {
    email: "hello@company.com",
    provider: "Custom SMTP",
    status: "Disconnected",
    sent: 13920,
  },
];

const Profile = () => {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f7f8fa]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">

        {/* ================= HEADER ================= */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-7 lg:px-10">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Account
                </p>

                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                  Profile
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage your account, security and connected email accounts.
                </p>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
              >
                {editing ? "Cancel Editing" : "Edit Profile"}
              </button>

            </div>
          </div>
        </div>


        {/* ================= CONTENT ================= */}
        <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:px-10">


          {/* ================= PROFILE HERO ================= */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* Cover */}
            <div className="h-32 bg-gradient-to-r from-gray-950 via-gray-800 to-gray-950" />

            <div className="px-6 pb-7">

              <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                <div className="flex items-end gap-5">

                  {/* Avatar */}
                  <div className="relative">

                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gray-900 text-2xl font-semibold text-white shadow-lg">
                      MK
                    </div>

                    {/* Online */}
                    <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500" />

                  </div>

                  <div className="pb-1">

                    <h2 className="text-2xl font-semibold text-gray-900">
                      Muhib Khan
                    </h2>

                    <p className="text-sm text-gray-500">
                      muhib@example.com
                    </p>

                  </div>

                </div>


                <div className="flex items-center gap-2 pb-1">

                  <span className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Active account
                  </span>

                </div>

              </div>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">

                <span>
                  Member since August 2026
                </span>

                <span className="hidden text-gray-300 sm:block">
                  •
                </span>

                <span>
                  Last login today
                </span>

              </div>

            </div>
          </section>


          {/* ================= STATS ================= */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <StatCard
              label="Campaigns"
              value="24"
              description="+4 this month"
            />

            <StatCard
              label="Emails sent"
              value="48,250"
              description="+12.5% this month"
            />

            <StatCard
              label="Sender accounts"
              value="5"
              description="2 currently active"
            />

          </section>


          {/* ================= GRID ================= */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">


            {/* ================= PERSONAL INFO ================= */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm xl:col-span-2">

              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Personal information
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Your basic account information.
                  </p>
                </div>

                <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  Account
                </span>

              </div>


              <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">

                <InputField
                  label="Full name"
                  value="Muhib Khan"
                  disabled={!editing}
                />

                <InputField
                  label="Email address"
                  value="muhib@example.com"
                  disabled={!editing}
                />

                <InputField
                  label="Username"
                  value="@muhib"
                  disabled={!editing}
                />

                <InputField
                  label="Timezone"
                  value="Asia/Karachi (GMT+5)"
                  disabled={!editing}
                />

              </div>


              {editing && (
                <div className="flex justify-end border-t border-gray-100 px-6 py-4">

                  <button className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
                    Save changes
                  </button>

                </div>
              )}

            </section>


            {/* ================= SECURITY ================= */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div className="border-b border-gray-100 px-6 py-5">

                <h2 className="font-semibold text-gray-900">
                  Security
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Protect your account.
                </p>

              </div>


              <div className="divide-y divide-gray-100">

                <SecurityItem
                  title="Password"
                  description="Last changed 30 days ago"
                  action="Change"
                />

                <SecurityItem
                  title="Two-factor authentication"
                  description="Not enabled"
                  action="Enable"
                />

                <SecurityItem
                  title="Active sessions"
                  description="1 active session"
                  action="View"
                />

              </div>

            </section>

          </div>


          {/* ================= SENDERS ================= */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="font-semibold text-gray-900">
                  Connected sender accounts
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Email accounts used to send your campaigns.
                </p>
              </div>

              <button className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
                + Add sender
              </button>

            </div>


            <div className="divide-y divide-gray-100">

              {senderAccounts.map((sender) => (
                <div
                  key={sender.email}
                  className="flex flex-col gap-4 px-6 py-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="flex items-center gap-4">

                    {/* Provider Icon */}
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-sm font-semibold text-gray-700">
                      {sender.provider === "Gmail SMTP"
                        ? "G"
                        : sender.provider === "Outlook SMTP"
                        ? "O"
                        : "S"}
                    </div>


                    <div>

                      <p className="font-medium text-gray-900">
                        {sender.email}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">

                        <span>
                          {sender.provider}
                        </span>

                        <span className="text-gray-300">
                          •
                        </span>

                        <span>
                          {sender.sent.toLocaleString()} emails sent
                        </span>

                      </div>

                    </div>

                  </div>


                  <div className="flex items-center gap-4">

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        sender.status === "Active"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {sender.status}
                    </span>

                    <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100">
                      Manage
                    </button>

                  </div>

                </div>
              ))}

            </div>

          </section>


          {/* ================= DANGER ZONE ================= */}
          <section className="rounded-2xl border border-red-200 bg-red-50/40">

            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="font-semibold text-red-900">
                  Delete account
                </h2>

                <p className="mt-1 max-w-xl text-sm text-red-700/70">
                  Permanently delete your account and all associated
                  campaigns, templates and email data.
                </p>

              </div>

              <button className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50">
                Delete account
              </button>

            </div>

          </section>

        </div>
      </main>
    </div>
  );
};


/* ========================================================= */
/* Components */
/* ========================================================= */

interface StatCardProps {
  label: string;
  value: string;
  description: string;
}

const StatCard = ({
  label,
  value,
  description,
}: StatCardProps) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-400">
        {description}
      </p>

    </div>
  );
};


interface InputFieldProps {
  label: string;
  value: string;
  disabled: boolean;
}

const InputField = ({
  label,
  value,
  disabled,
}: InputFieldProps) => {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type="text"
        defaultValue={value}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      />

    </div>
  );
};


interface SecurityItemProps {
  title: string;
  description: string;
  action: string;
}

const SecurityItem = ({
  title,
  description,
  action,
}: SecurityItemProps) => {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-5">
      <div>

        <p className="text-sm font-medium text-gray-900">
          {title}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {description}
        </p>

      </div>

      <button className="text-sm font-medium text-gray-700 transition hover:text-black">
        {action}
      </button>

    </div>
  );
};


export default Profile;