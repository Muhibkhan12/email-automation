/**
 * senderAccount.types.ts
 *
 * Plain TypeScript types for sender_accounts CRUD.
 * No library needed — just interfaces + simple runtime checks.
 */

/* ------------------------------- Full row ------------------------------- */
/* What one row looks like when you READ it from the database/API. */

export interface SenderAccount {
  id: string
  user_id: string
  display_name: string
  email: string
  provider: string
  status: string
  daily_limit: number
  hourly_limit: number
  emails_sent_today: number
  emails_sent_hour: number
  created_at: string
  updated_at: string
}

/* -------------------------------- CREATE -------------------------------- */
/* What you send when adding a new account. id/timestamps/counters are
   set by the server, so they're not here. */

export interface CreateSenderAccountInput {
  user_id: string
  display_name: string
  email: string
  provider: string
  daily_limit: number
  hourly_limit: number
}

/* -------------------------------- UPDATE -------------------------------- */
/* What you send when editing. Everything optional (only send what changed). */

export interface UpdateSenderAccountInput {
  display_name?: string
  email?: string
  status?: string
  daily_limit?: number
  hourly_limit?: number
}

/* ---------------------------- READ / DELETE ------------------------------ */
/* What you need to fetch or delete one account. */

export interface SenderAccountIdParam {
  id: string
  user_id: string
}

/* --------------------------------------------------------------------- */
/*  Simple runtime type checks (only use these if data is coming from
    outside — like an API response — and you're not 100% sure of the shape) */
/* --------------------------------------------------------------------- */

// export function isSenderAccount(data: any): data is SenderAccount {
//   return (
//     typeof data === "object" && data !== null &&
//     typeof data.id === "string" &&
//     typeof data.user_id === "string" &&
//     typeof data.display_name === "string" &&
//     typeof data.email === "string" &&
//     typeof data.provider === "string" &&
//     typeof data.status === "string" &&
//     typeof data.daily_limit === "number" &&
//     typeof data.hourly_limit === "number" &&
//     typeof data.emails_sent_today === "number" &&
//     typeof data.emails_sent_hour === "number" &&
//     typeof data.created_at === "string" &&
//     typeof data.updated_at === "string"
//   )
// }

// export function isCreateSenderAccountInput(data: any): data is CreateSenderAccountInput {
//   return (
//     typeof data === "object" && data !== null &&
//     typeof data.user_id === "string" &&
//     typeof data.display_name === "string" &&
//     typeof data.email === "string" &&
//     typeof data.provider === "string" &&
//     typeof data.daily_limit === "number" &&
//     typeof data.hourly_limit === "number"
//   )
// }

// export function isUpdateSenderAccountInput(data: any): data is UpdateSenderAccountInput {
//   if (typeof data !== "object" || data === null) return false

//   if (data.display_name !== undefined && typeof data.display_name !== "string") return false
//   if (data.email !== undefined && typeof data.email !== "string") return false
//   if (data.status !== undefined && typeof data.status !== "string") return false
//   if (data.daily_limit !== undefined && typeof data.daily_limit !== "number") return false
//   if (data.hourly_limit !== undefined && typeof data.hourly_limit !== "number") return false

//   return true
// }

// export function isSenderAccountIdParam(data: any): data is SenderAccountIdParam {
//   return (
//     typeof data === "object" && data !== null &&
//     typeof data.id === "string" &&
//     typeof data.user_id === "string"
//   )
// }