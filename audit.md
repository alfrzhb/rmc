# Audit Proyek RMC

Tanggal audit awal: 2026-07-05  
Tanggal update pasca-eksekusi rekomendasi: 2026-07-05
Tanggal update Phase 15 custom domain staging: 2026-07-05

## Ringkasan Eksekutif

Proyek sudah selaras dengan scope MVP di docs: Cloudflare Pages + Workers + D1 + Access, backend Hono, validasi Zod, D1 migrations, external document links, audit logs, dan UI operasional utama.

Setelah rekomendasi audit 1-7 dieksekusi, posisi proyek berubah dari "Phase 14 local checkpoint dengan beberapa refinement besar" menjadi "siap lanjut Phase 15 staging preparation". UI sekarang tidak hanya create/list/delete, tetapi sudah punya detail/edit dan nested workflows untuk flow utama.

Kesimpulan terbaru:

- Backend API utama sesuai docs dan lulus probe lokal.
- Database tetap memakai D1 dan `document_links`; tidak memakai R2.
- UI utama sudah punya list/create/delete/detail/edit untuk entity utama.
- Nested UI sudah tersedia untuk contacts, opportunity logs, project members, project activities, dan invoice payments.
- Document Link UI sudah memakai selector linked record untuk entity utama, bukan raw ID.
- Delete action sudah memakai confirmation.
- Form create reset setelah mutation sukses.
- CI workflow sudah ditambahkan untuk lint/typecheck/build.
- Phase 14 local smoke test tetap lulus.

Sisa pekerjaan utama:

- Phase 15 staging custom-domain verification tertahan di DNS permission dan Access permission.
- Browser-level UI automation belum ada.
- Reports, Settings, dan Users management UI masih placeholder.
- `ALLOWED_ORIGIN` masih berupa config yang belum dipakai middleware karena API saat ini didesain same-origin lewat `/api`.

## Update Phase 15 Staging

Status per 2026-07-05 sebelum custom-domain attempt:

- Git checkpoint `3a47c8c` sudah dipush ke `origin/main`.
- Staging D1 migration command berhasil; tidak ada migration pending.
- Worker staging berhasil deploy ke `ratama-tracker-api-staging`.
- Worker staging memakai D1 binding `rmc_staging`.
- Worker staging tetap tanpa R2 binding.
- Cloudflare Pages project `ratama-tracker-web-staging` dibuat.
- Pages staging berhasil deploy.
- Frontend staging tersedia dan merespons `200` di `https://ratama-tracker-web-staging.pages.dev`.

Custom-domain staging attempt per 2026-07-05:

- Zone `alfrzhb.com` aktif di Cloudflare.
- Nameserver publik `alfrzhb.com` sudah mengarah ke Cloudflare: `donna.ns.cloudflare.com` dan `kaiser.ns.cloudflare.com`.
- Pages custom domain `staging-rmc.alfrzhb.com` berhasil ditambahkan ke project `ratama-tracker-web-staging`.
- Status Pages custom domain masih `pending` dengan error `CNAME record not set`.
- Worker route `staging-rmc.alfrzhb.com/api/*` sudah ada dan mengarah ke `ratama-tracker-api-staging`.
- Frontend tetap memakai same-origin `/api` melalui `VITE_API_BASE_URL=/api`.
- Percobaan membuat DNS CNAME `staging-rmc -> ratama-tracker-web-staging.pages.dev` dengan `proxied=true` ditolak Cloudflare API: `Authentication error`.
- Percobaan membaca/mengelola Cloudflare Access app juga ditolak Cloudflare API: `Authentication error`.

Belum selesai karena blocker:

- DNS record `staging-rmc.alfrzhb.com` belum bisa dibuat/diverifikasi dari token saat ini.
- `https://staging-rmc.alfrzhb.com` belum resolve DNS.
- `https://staging-rmc.alfrzhb.com/api/health` belum bisa diverifikasi karena DNS belum resolve.
- Cloudflare Access staging belum bisa dibuat/diverifikasi karena token saat ini tidak punya permission Access yang dibutuhkan.
- Login Access, `GET /api/auth/me`, dashboard load, dan CRUD staging belum bisa dites sebelum DNS dan Access siap.

Guardrail:

- Production tidak dideploy.
- Production D1 tidak dibuat atau diubah.
- DNS record `rmc.alfrzhb.com` tidak dibuat.
- Tidak ada R2 yang dibuat/dipakai.
- Binary upload tetap tidak diaktifkan.
- D1 staging tetap `rmc_staging`.
- Worker staging tetap `ratama-tracker-api-staging`.
- Pages staging tetap `ratama-tracker-web-staging`.
- Satu-satunya perubahan Cloudflare yang berhasil dibuat adalah Pages custom domain staging `staging-rmc.alfrzhb.com`; DNS record staging belum berhasil dibuat karena permission blocker.

## Status Eksekusi Rekomendasi 1-7

| No  | Rekomendasi                                             | Status  | Implementasi                                                                                                     |
| --- | ------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Update `docs/plan.md` agar status phase tidak stale     | Selesai | Current Position dan status Phase 2/3 sudah diperbarui.                                                          |
| 2   | Fix UX form reset dan cache invalidation payment delete | Selesai | Form reset dipindahkan ke success path; cache finance/dashboard ikut di-invalidate.                              |
| 3   | Tambahkan confirmation dialog untuk delete              | Selesai | Shared `DeleteButton` sekarang memakai confirmation.                                                             |
| 4   | Buat detail/edit screens untuk entity utama             | Selesai | Detail/edit tersedia untuk clients, opportunities, projects, invoices, payments, payables, document links.       |
| 5   | Tambahkan nested UI untuk workflow penting              | Selesai | Contacts, opportunity logs, project members, project activities, dan invoice payments sudah ada.                 |
| 6   | Perbaiki Document Link UI agar tidak meminta raw ID     | Selesai | Form document link memakai selector linked record untuk CLIENT, OPPORTUNITY, PROJECT, INVOICE, PAYMENT, PAYABLE. |
| 7   | Tambahkan CI untuk lint/typecheck/build                 | Selesai | `.github/workflows/ci.yml` ditambahkan.                                                                          |

## Verifikasi Yang Dijalankan

Command:

```bash
pnpm lint
pnpm typecheck
pnpm build:web
pnpm build:api
pnpm test:phase14:local
```

Hasil:

- `pnpm lint`: lulus.
- `pnpm typecheck`: lulus untuk `apps/api`, `apps/web`, `packages/db`, `packages/validation`, dan `packages/shared`.
- `pnpm build:web`: lulus.
- `pnpm build:api`: lulus.
- `pnpm test:phase14:local`: lulus.

Smoke test Phase 14 mencakup:

- health check
- local D1 migration check
- user access
- client CRUD
- opportunity flow
- project flow
- invoice/payment sync
- payable flow
- Document Link CRUD

Probe tambahan manual via local Worker juga pernah dijalankan dan lulus:

- Request tanpa Access header ditolak `401`.
- `POST /api/attachments/upload` mengembalikan `410`.
- Role `STAFF` ditolak dari `/api/audit-logs` dengan `403`.
- Client contact CRUD berjalan.
- Opportunity log CRUD berjalan.
- Project member dan project activity berjalan.
- Project activity `progress_snapshot` memperbarui `project.progress_percentage`.
- Audit log write/filter berjalan untuk entity project.

## Kesesuaian Dengan Docs

| Area                                                     | Status Terbaru         | Catatan                                                                             |
| -------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| Arsitektur Cloudflare Pages + Workers + D1 + Access      | Sesuai                 | Tech stack dan config Worker mengikuti docs.                                        |
| External Document Link, tanpa R2                         | Sesuai                 | `document_links` aktif, upload binary legacy disabled, tidak ada R2 binding.        |
| Access identity via `cf-access-authenticated-user-email` | Sesuai                 | Protected APIs memakai active user lookup.                                          |
| Users API dan RBAC                                       | Sesuai backend         | API ada dan owner/admin restricted. UI settings/users belum dibuat.                 |
| Clients dan contacts                                     | Sesuai                 | Backend CRUD lulus; UI list/create/delete/detail/edit + contacts tersedia.          |
| Opportunities dan logs                                   | Sesuai                 | Backend CRUD lulus; UI list/create/delete/detail/edit + logs tersedia.              |
| Projects, members, activities, progress                  | Sesuai                 | Backend lulus; UI list/create/delete/detail/edit + members/activities tersedia.     |
| Finance: invoices, payments, payables                    | Sesuai                 | API dan smoke test lulus; UI list/create/delete/detail/edit tersedia.               |
| Dashboard summary                                        | Sesuai                 | UI membaca `/api/dashboard/summary`.                                                |
| Document Links                                           | Sesuai                 | CRUD tersedia; UI memakai selector linked record untuk entity utama.                |
| Audit logs                                               | Sesuai backend         | API filter dan RBAC lulus; UI audit log belum ada.                                  |
| Phase 13 UI acceptance                                   | Selesai dan terlampaui | Acceptance create/list/delete terpenuhi; detail/edit refinement sudah ditambahkan.  |
| Phase 14 testing                                         | Sesuai lokal           | `pnpm test:phase14:local` lulus.                                                    |
| CI                                                       | Ada                    | GitHub Actions config sudah ditambahkan; akan berjalan setelah push/PR.             |
| Phase 15 staging deployment                              | Sebagian selesai       | D1/Worker/Pages selesai; Pages custom domain staging dibuat tetapi pending CNAME; Access dan CRUD staging masih pending. |
| Production readiness                                     | Belum                  | Production D1 ID masih placeholder sesuai guardrail.                                |

## Temuan Yang Sudah Resolved

### R1. `docs/plan.md` masih menyebut posisi proyek sekitar Phase 3

Status: Resolved

`docs/plan.md` sudah diperbarui agar Current Position mencerminkan posisi aktual: backend foundation selesai, UI MVP/refinement utama tersedia, Phase 14 local smoke test lulus, dan next milestone adalah Phase 15 staging.

### R2. UI belum mencakup nested business workflows

Status: Resolved untuk workflow utama

Detail/edit dan nested UI sudah ditambahkan:

- Client detail + contacts.
- Opportunity detail + logs.
- Project detail + members + activities + progress.
- Invoice detail + payments.
- Payment detail.
- Payable detail.
- Document Link detail.

Catatan: UI audit logs, reports, dan users/settings tetap belum dibuat.

### R3. Form UI reset sebelum request create sukses

Status: Resolved

Form create sekarang melakukan reset melalui success path mutation, sehingga input user tidak hilang ketika request gagal.

### R4. Document Link UI meminta raw `linked_id`

Status: Resolved untuk entity utama

Document Link form sekarang memakai linked record selector untuk:

- CLIENT
- OPPORTUNITY
- PROJECT
- INVOICE
- PAYMENT
- PAYABLE

Catatan: linked type `OPPORTUNITY_LOG` dan `PROJECT_ACTIVITY` belum dibuat sebagai pilihan UI utama karena keduanya nested di detail page dan tidak punya listing global yang ergonomis.

### R5. Delete action di UI belum punya konfirmasi

Status: Resolved

Shared `DeleteButton` sekarang meminta confirmation sebelum menjalankan delete.

### R6. Cache invalidation UI finance belum lengkap

Status: Resolved

Mutation payment/invoice/payable sekarang meng-invalidate query terkait termasuk `dashboard-summary` saat relevan.

### R7. Belum ada CI

Status: Resolved

Workflow `.github/workflows/ci.yml` ditambahkan untuk:

- install dependencies dengan frozen lockfile
- lint
- typecheck
- build web
- build API

## Temuan Terbuka

### O1. Staging custom domain dan Access belum diverifikasi

Severity: Medium

Phase 15 sudah dijalankan sebagian. D1 staging, Worker staging, Pages staging, dan Pages custom domain staging sudah dibuat. Zone `alfrzhb.com` aktif di Cloudflare, tetapi Pages custom domain masih pending karena DNS CNAME `staging-rmc.alfrzhb.com` belum ada. Token Cloudflare saat ini bisa membaca zone dan mengelola Pages/Worker route, tetapi ditolak saat membaca/membuat DNS record dan saat membaca/mengelola Cloudflare Access.

Rekomendasi:

- Grant permission Cloudflare yang dibutuhkan untuk akun/token yang dipakai CLI: DNS edit/read untuk zone `alfrzhb.com` dan Cloudflare Access app/policy write untuk account `28d54cb4ff50f6276f19041b481d98c8`.
- Buat DNS CNAME `staging-rmc` ke `ratama-tracker-web-staging.pages.dev` dengan proxy aktif.
- Tunggu Pages custom domain berubah dari `pending` menjadi active/verified.
- Configure/verify Cloudflare Access untuk `staging-rmc.alfrzhb.com`.
- Policy awal hanya mengizinkan email tester yang sama dengan user OWNER staging.
- Seed/verify OWNER user staging sesuai email Cloudflare Access.
- Test `https://staging-rmc.alfrzhb.com`, `https://staging-rmc.alfrzhb.com/api/health`, auth, dashboard, dan critical CRUD through Cloudflare Access.

### O2. Browser-level UI automation belum ada

Severity: Low to Medium

CI sudah ada untuk lint/typecheck/build, tetapi belum ada Playwright/browser smoke test. Karena frontend sekarang lebih kaya, browser automation akan membantu menangkap regressions pada form, route detail, dan selector Document Link.

Rekomendasi:

- Tambahkan Playwright smoke test minimal untuk:
  - dashboard load
  - client create/detail/contact/delete
  - opportunity log flow
  - project activity progress flow
  - invoice/payment flow
  - document link selector flow

### O3. Reports, Settings, dan Users UI masih placeholder

Severity: Low

Backend users API sudah ada dan audit logs API sudah ada, tetapi UI Settings/Users dan Reports belum dibuat.

Rekomendasi:

- Jika staging MVP cukup dengan owner/admin bootstrap manual, biarkan sebagai refinement.
- Jika user management perlu dilakukan dari app, buat Settings > Users sebelum production.

### O4. `ALLOWED_ORIGIN` belum dipakai middleware

Severity: Low

`ALLOWED_ORIGIN` ada di `wrangler.toml` dan env type, tetapi API saat ini berjalan same-origin lewat `/api`, sehingga CORS middleware belum diperlukan. Variable ini tidak menjadi blocker, tetapi perlu keputusan eksplisit.

Rekomendasi:

- Jika API tetap same-origin, dokumentasikan bahwa CORS tidak dipakai.
- Jika API akan dipanggil cross-origin, tambahkan Hono CORS middleware yang memakai `ALLOWED_ORIGIN`.

## Hal Yang Sudah Kuat

- Backend route map lengkap dan sesuai module aktif di docs.
- Protected APIs memakai `requireActiveUser`.
- Users dan audit logs dibatasi OWNER/ADMIN.
- Soft delete diterapkan di module utama dan submodule.
- Document Link API memvalidasi linked entity dan URL.
- Legacy binary upload route disabled dengan status `410`.
- Migration `0002_document_links_no_r2.sql` sesuai strategi external link.
- Local Vite proxy mengirim header Access lokal.
- Phase 14 smoke test repeatable dan membersihkan data test.
- UI detail/edit dan nested workflow utama sudah tersedia.
- CI lint/typecheck/build sudah dikonfigurasi.

## Rekomendasi Urutan Kerja Berikutnya

1. Berikan/grant Cloudflare permission DNS edit/read dan Access app/policy write untuk akun/token CLI.
2. Buat DNS CNAME `staging-rmc` ke `ratama-tracker-web-staging.pages.dev` dengan proxy aktif.
3. Tunggu Pages custom domain `staging-rmc.alfrzhb.com` verified.
4. Configure/verify Cloudflare Access untuk staging setelah domain aktif.
5. Seed/verify OWNER user staging sesuai Cloudflare Access email.
6. Test staging lewat browser dan API custom domain.
7. Pastikan GitHub Actions CI lulus di remote.
8. Tambahkan browser automation jika staging flow sudah stabil.
9. Buat Settings/Users dan Reports UI bila dibutuhkan sebelum production.

## Status Akhir Audit

Proyek sudah melewati sebagian besar Phase 15 deployment: D1 staging, Worker staging, Pages staging, dan Pages custom domain staging sudah dibuat. Staging belum bisa dinyatakan selesai penuh karena DNS CNAME staging belum bisa dibuat dengan permission token saat ini, Cloudflare Access belum bisa dikonfigurasi, health check custom domain belum resolve, dan critical CRUD staging belum tervalidasi. Production tetap belum boleh dilakukan sebelum staging tervalidasi dan production D1 dikonfirmasi.
