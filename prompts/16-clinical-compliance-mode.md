# Prompt 16 — Clinical / compliance mode (optional)

**Milestone:** M5 — It ships  
**Depends on:** Prompt 14

> Paste the text below into Codex as a single task.

---

Add an optional clinical mode (off by default; enabled per-installation) that brings the regulated-environment features clinical labs need — in the spirit of FCS Express's compliance support. When enabled: enforce user accounts with authentication and roles, capture an immutable audit trail of every action with timestamps and user identity, support electronic signatures on reports and locked analyses, allow locking/finalizing an analysis so it can no longer be altered (only versioned), and produce compliance-oriented exports. Provide configuration for retention and access controls.

Keep this cleanly separated so it never complicates the default research experience, and document clearly that compliance is a shared responsibility between the software configuration and the lab's procedures.

Done when: with clinical mode enabled I get authenticated roles, a complete immutable audit trail, electronic signatures on reports, the ability to lock/finalize analyses, and compliance exports — while the default (research) mode remains unchanged and uncluttered.
