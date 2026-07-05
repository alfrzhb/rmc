# Audit Proyek RMC

Tanggal audit awal: 2026-07-05  
Tanggal update pasca-eksekusi rekomendasi: 2026-07-05
Tanggal update Phase 15 custom domain staging: 2026-07-05
Tanggal update Phase 15 staging user bootstrap: 2026-07-05
Tanggal update Phase 15 staging functional verification: 2026-07-05
Tanggal finalisasi Phase 15 staging verification: 2026-07-05
Tanggal update pre-production Users Management refinement: 2026-07-05

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
- Settings -> Users Management sudah tersedia untuk OWNER/ADMIN.
- CI workflow sudah ditambahkan untuk lint/typecheck/build.
- Phase 14 local smoke test tetap lulus.

Status terbaru:

- Phase 15 staging verification selesai berdasarkan browser test manual user.
- Custom domain, Worker route, dan Cloudflare Access sudah aktif.
- Bootstrap app user staging untuk email Access `v60code@gmail.com` sudah dilakukan di D1 staging.
- `/api/auth/me` staging sudah berhasil untuk OWNER `v60code@gmail.com`.
- Automated CLI verification untuk protected API/CRUD masih membutuhkan sesi Cloudflare Access atau service token test; CLI tanpa session diarahkan ke login Access.
- Browser-level UI automation belum ada.
- Reports masih placeholder.
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

Historical blocker yang sudah resolved manual:

- DNS record/custom domain `staging-rmc.alfrzhb.com` sempat belum bisa dibuat dari token CLI.
- Cloudflare Access staging sempat belum bisa dikonfigurasi dari token CLI.
- Setelah konfigurasi manual, frontend staging, `/api/health`, Cloudflare Access login, `/api/auth/me`, dashboard, dan CRUD staging sudah berhasil.

Guardrail:

- Production tidak dideploy.
- Production D1 tidak dibuat atau diubah.
- DNS record `rmc.alfrzhb.com` tidak dibuat.
- Tidak ada R2 yang dibuat/dipakai.
- Binary upload tetap tidak diaktifkan.
- D1 staging tetap `rmc_staging`.
- Worker staging tetap `ratama-tracker-api-staging`.
- Pages staging tetap `ratama-tracker-web-staging`.
- Setelah staging berjalan, konfigurasi staging tidak diubah lagi oleh agent.

Manual verification update dari user per 2026-07-05:

- `https://staging-rmc.alfrzhb.com` berhasil membuka frontend staging.
- `https://staging-rmc.alfrzhb.com/api/health` berhasil dan mengembalikan `{"status":"ok","service":"ratama-tracker-api"}`.
- Cloudflare Access login berhasil memakai email `v60code@gmail.com`.
- `GET /api/auth/me` sempat gagal dengan `USER_NOT_REGISTERED`.
- UI sempat menampilkan banner `Access identity is not connected to an active app user.`

Staging user bootstrap per 2026-07-05:

- Schema tabel `users` di D1 staging `rmc_staging` sudah diinspeksi dan sesuai migrasi.
- Sebelum bootstrap, tidak ada row user untuk email `v60code@gmail.com`.
- Tabel `users` staging kosong, sehingga `usr_owner_001` aman dipakai sebagai bootstrap id.
- User OWNER aktif berhasil dibuat di D1 staging:
  - `id`: `usr_owner_001`
  - `email`: `v60code@gmail.com`
  - `name`: `Owner Ratama`
  - `role`: `OWNER`
  - `status`: `ACTIVE`
  - `deleted_at`: `NULL`
- Setelah seed, query D1 staging mengembalikan row tersebut dengan role/status yang benar.

Verification setelah bootstrap:

- CLI tanpa sesi Cloudflare Access mendapat `302 Found` ke login Access untuk `https://staging-rmc.alfrzhb.com` dan `https://staging-rmc.alfrzhb.com/api/auth/me`.
- Ini menunjukkan Access gate aktif, tetapi CLI belum memiliki cookie Access untuk menguji protected endpoint.
- Karena tidak ada `cloudflared`/Playwright authenticated session/service token test di repo, verifikasi otomatis dashboard dan CRUD staging belum bisa diselesaikan dari CLI.
- Browser manual test kemudian menyelesaikan `/api/auth/me`, dashboard, dan flow CRUD utama.

Functional verification update dari user per 2026-07-05:

- Cloudflare Access login berhasil memakai `v60code@gmail.com`.
- `GET https://staging-rmc.alfrzhb.com/api/auth/me` berhasil dari browser yang sudah login Access.
- Response `/api/auth/me`:
  - `success`: `true`
  - `id`: `usr_owner_001`
  - `email`: `v60code@gmail.com`
  - `role`: `OWNER`
  - `status`: `ACTIVE`
- Kesimpulan: custom domain, Worker route, Cloudflare Access, dan app user mapping sudah berhasil.
- Dashboard load lulus.
- Banner user mapping sudah hilang.
- Clients CRUD lulus.
- Client contacts lulus.
- Opportunities CRUD lulus.
- Opportunity logs lulus.
- Projects CRUD lulus.
- Project members lulus.
- Project activities dan progress update lulus.
- Invoices CRUD lulus.
- Payments dan invoice status sync lulus.
- Payables CRUD lulus.
- Document Links CRUD lulus.
- Custom domain `staging-rmc.alfrzhb.com` berjalan.
- Worker route `staging-rmc.alfrzhb.com/api/*` berjalan.
- Cloudflare Access berjalan.
- Production belum disentuh: tidak ada production deploy, tidak ada production D1 create/update, dan tidak ada DNS `rmc.alfrzhb.com`.

Agent CLI verification per 2026-07-05:

- `curl https://staging-rmc.alfrzhb.com/api/auth/me` tanpa Access session mengembalikan `302 Found` ke Cloudflare Access login.
- `curl https://staging-rmc.alfrzhb.com/api/health` tanpa Access session juga mengembalikan `302 Found` ke Cloudflare Access login.
- Percobaan menambahkan header `cf-access-authenticated-user-email: v60code@gmail.com` dari CLI tetap diarahkan ke login Access.
- Root cause: Cloudflare Access mencegah request CLI tanpa cookie/session Access; ini expected dan bukan error aplikasi.

Staging functional verification matrix:

| Flow | Status | Catatan |
| --- | --- | --- |
| Frontend load | Lulus manual | `https://staging-rmc.alfrzhb.com` membuka frontend staging. |
| API health | Lulus manual | `/api/health` mengembalikan `{"status":"ok","service":"ratama-tracker-api"}` dari browser/session Access. |
| Cloudflare Access login | Lulus manual | Login memakai `v60code@gmail.com`. |
| App user mapping | Lulus manual | `/api/auth/me` mengembalikan `usr_owner_001`, role `OWNER`, status `ACTIVE`. |
| Dashboard load | Lulus manual | Dashboard terbuka dan banner user mapping hilang. |
| Client CRUD | Lulus manual | Create/list/detail/update/delete berjalan di browser staging. |
| Client contact CRUD | Lulus manual | Contacts berjalan di client detail. |
| Opportunity CRUD | Lulus manual | Create/list/detail/update/delete berjalan di browser staging. |
| Opportunity log CRUD | Lulus manual | Logs berjalan di opportunity detail. |
| Project CRUD | Lulus manual | Create/list/detail/update/delete berjalan di browser staging. |
| Project member CRUD | Lulus manual | Members berjalan di project detail. |
| Project activity CRUD dan progress update | Lulus manual | Activities berjalan dan progress update tersinkron. |
| Invoice CRUD | Lulus manual | Create/list/detail/update/delete berjalan di browser staging. |
| Payment CRUD dan invoice status sync | Lulus manual | Payments berjalan dan status invoice tersinkron. |
| Payable CRUD | Lulus manual | Create/list/detail/update/delete berjalan di browser staging. |
| Document Link CRUD | Lulus manual | Create/list/detail/update/delete document link berjalan tanpa R2/binary upload. |

## Pre-production Users Management Refinement

Status per 2026-07-05: selesai.

Users API audit:

| Endpoint | Status | Catatan |
| --- | --- | --- |
| `GET /api/users` | Sesuai | OWNER/ADMIN only; mengembalikan non-deleted users. |
| `GET /api/users/:id` | Sesuai | OWNER/ADMIN only; `404` untuk user tidak ditemukan/deleted. |
| `POST /api/users` | Sesuai | OWNER/ADMIN only; validasi email/name/role/status; konflik email `409`. |
| `PUT /api/users/:id` | Sesuai | OWNER/ADMIN only; update email/name/role/status; menulis audit log. |
| `DELETE /api/users/:id` | Sesuai | OWNER/ADMIN only; soft delete dengan status `INACTIVE` dan `deleted_at`. |

UI yang ditambahkan:

- Settings -> Users Management menggantikan placeholder Settings.
- Halaman hanya bisa digunakan oleh role `OWNER` dan `ADMIN`.
- Role `STAFF` melihat restricted state di UI dan tetap ditolak backend dengan `403`.
- User list menampilkan name, email, role, status, dan last login.
- Create user tersedia untuk `email`, `name`, `role`, dan `status`.
- Edit user tersedia untuk `email`, `name`, `role`, dan `status`.
- Role options di UI dibatasi ke `OWNER`, `ADMIN`, dan `STAFF`.
- Status options di UI dibatasi ke `ACTIVE` dan `INACTIVE`.
- Deactivate dan delete memakai confirmation.
- Delete tetap soft delete di backend.
- Help text ditambahkan: `Login menggunakan Cloudflare Access. User tetap harus didaftarkan di aplikasi agar bisa masuk sesuai role.`
- Unregistered Access identity sekarang menampilkan: `Akun Anda belum terdaftar di aplikasi. Hubungi OWNER/ADMIN.`

Verification:

- `pnpm lint`: lulus.
- `pnpm typecheck`: lulus.
- `pnpm build:web`: lulus.
- `pnpm build:api`: lulus.
- Local migration check: `pnpm db:migrate:local` lulus, tidak ada migration pending.
- Local Users API test via Worker:
  - OWNER `/api/auth/me`: lulus.
  - OWNER `GET /api/users`: lulus.
  - OWNER `POST /api/users`: lulus.
  - OWNER `PUT /api/users/:id` untuk role/status: lulus.
  - OWNER `DELETE /api/users/:id`: lulus.
  - STAFF `GET /api/users`: ditolak `403`, sesuai ekspektasi.
  - INACTIVE user `GET /api/clients`: ditolak `403`, sesuai ekspektasi.

Guardrail:

- Production tidak dideploy.
- Production D1 tidak dibuat atau diubah.
- DNS `rmc.alfrzhb.com` tidak dibuat.
- Staging yang sudah berjalan tidak diubah/deploy ulang.
- R2 tidak dipakai.
- Binary upload tidak diaktifkan.

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
| Users API dan RBAC                                       | Sesuai                 | API owner/admin restricted; Settings -> Users Management tersedia untuk OWNER/ADMIN. |
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
| Phase 15 staging deployment                              | Selesai                | Custom domain, route, Access, OWNER staging, `/api/auth/me`, dashboard, dan critical CRUD lulus manual. |
| Pre-production Users Management                          | Selesai                | Settings -> Users Management, RBAC UI, create/edit/deactivate/delete, and local API verification done. |
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

### O1. Automated protected API verification via CLI belum tersedia

Severity: Low

Phase 15 staging verification selesai berdasarkan browser test manual. D1 staging, Worker staging, Pages staging, custom domain staging, Worker route, Cloudflare Access, `/api/auth/me`, dashboard, dan critical CRUD sudah aktif/lulus. Root cause `USER_NOT_REGISTERED` sudah diperbaiki dengan bootstrap OWNER di D1 staging. Satu-satunya batasan tersisa adalah agent CLI belum punya sesi/service token Cloudflare Access untuk mengulang protected CRUD secara otomatis.

Catatan:

- Jika ingin automated staging verification dari CLI, siapkan Cloudflare Access service token test atau `cloudflared access` login workflow.
- CLI tanpa Access session tetap mendapat `302 Found` ke Cloudflare Access login; ini expected.
- Production belum disentuh.

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

### O3. Reports UI masih placeholder

Severity: Low

Backend users API dan Settings -> Users Management sudah ada. Reports UI masih placeholder.

Rekomendasi:

- Buat Reports UI bila dibutuhkan sebelum production.
- Audit Logs UI juga masih bisa menjadi refinement untuk OWNER/ADMIN.

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
- Users Management UI tersedia untuk OWNER/ADMIN.
- CI lint/typecheck/build sudah dikonfigurasi.

## Rekomendasi Urutan Kerja Berikutnya

1. Mulai Phase 16 production preparation hanya setelah konfirmasi eksplisit user.
2. Sebelum Phase 16, konfirmasi production D1, domain `rmc.alfrzhb.com`, DNS, Access policy, first OWNER, dan deployment checklist.
3. Jika verifikasi otomatis diperlukan, siapkan Cloudflare Access service token test atau workflow `cloudflared access`.
4. Pastikan GitHub Actions CI lulus di remote.
5. Tambahkan browser automation jika staging flow sudah stabil.
6. Buat Reports/Audit Logs UI bila dibutuhkan sebelum production.

## Status Akhir Audit

Phase 15 staging verification selesai, dan pre-production Users Management refinement juga selesai. D1 staging, Worker staging, Pages staging, custom domain staging, Worker route, Cloudflare Access, OWNER bootstrap staging, `/api/auth/me`, dashboard, critical CRUD, dan Settings -> Users Management sudah tervalidasi. CLI tanpa Access session tetap diarahkan `302` ke Cloudflare Access login dan itu expected. Production belum disentuh; Phase 16 production preparation hanya boleh dimulai setelah konfirmasi eksplisit user.
