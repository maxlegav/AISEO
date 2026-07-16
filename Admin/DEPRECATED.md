# DEPRECATED — standalone Admin app

This standalone Next.js admin app has been **merged into the main `WebSite/` app**.

The full human-in-the-loop review workflow (dashboard, audit list, audit detail,
prompt review/editing, approve/reject, final delivery + client email) now lives in
`WebSite/` under a single admin surface:

| Old (standalone `Admin/`) | New (in `WebSite/`) |
| --- | --- |
| `/` (dashboard) | `/admin` |
| `/audits` | `/admin/audits` |
| `/audits/[id]` | `/admin/audits/[id]` |
| `GET /api/stats` | `GET /api/admin/stats` |
| `GET /api/audits` | `GET /api/admin/audits` |
| `GET /api/audits/[id]` | `GET /api/admin/audits/[auditId]` |
| `POST /api/audits/approve` | `POST /api/admin/audits/[auditId]/review` |
| `POST /api/audits/update-questions` | `POST /api/admin/audits/[auditId]/update-questions` |

Access is gated by the same `ADMIN_EMAIL` env var and the WebSite NextAuth session.
Log in to the main app with the admin account and go to `/admin`.

**Do not deploy this folder anymore.** It is kept only for reference until the
integrated admin has been verified in production, after which it can be removed.
