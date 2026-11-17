# FPI Project – HealthPass (front end)
Plain HTML5 + CSS + JavaScript. No frameworks, no libraries, no build step.
Open `index.html` (or host on GitHub Pages) – it runs with mock data.
 
## Structure
- index.html – welcome + language (patient)   - register.html – create HealthPass, step 1
- app.html – patient app (#home #wallet #records #profile) + PIN payment approval sheet
- staff.html – clinic workspace (#dashboard #find #patient #visit #billing)
- assets/css/styles.css – all styles/design tokens   - assets/images/ – put images here (hero.jpg)
- assets/js/api.js – **back-end hand-off point**   - common.js – helpers   - app.js / staff.js – page logic
 
## For the back-end developer
1. Open `assets/js/api.js`, set `USE_MOCK:false` and `BASE_URL`.
2. Each `HealthPassAPI` method has its endpoint + JSON shape in a comment. Implement those routes in any stack/database.
3. Send `Authorization: Bearer <token>` (stored in `localStorage.hp_token` – add a login call).
4. Offline writes are queued (`hp_queue`) and replayed on reconnect – make POSTs idempotent.
5. Security: staff never see the patient PIN; verify it server-side. Demo PIN is 1234.
 
## v2 notes
- Auth: login.html + logout (profile) + 5-minute idle auto-logout. Session = `hp_session` in localStorage (mock). Replace with token from `/auth/login`.
- QR: `assets/js/qr.js` is our own generator (verified decodable). Payload is `HP:<HealthPass ID>`. Staff scan uses the browser BarcodeDetector (Chrome/Android, needs HTTPS - GitHub Pages is HTTPS) with typed-ID fallback.
- National scope: records are keyed by HealthPass ID, not by hospital; `/staff/patients/:id/history` must return records from ALL clinics.
- Clinics: `/clinics` (GET/POST). Staff > Register Clinic adds one; patients see it in Find a clinic.
- Profile photo is resized to 256px JPEG data-URL (`PATCH /me`); store it as a file/blob on the server in production.
- Demo login: HP-0234-8891 / PIN 1234. Clear site data to reset the mock users.
 
## v3: staff portal & admin (separate URLs, not linked from the patient app)
- Patients: `index.html`. Staff: `/staff/` (login, register-clinic, register-staff, workspace). Admin: `/admin/login.html`.
- Roles: main **admin** approves clinics -> clinic registrant becomes **subadmin** -> staff register under a clinic and the subadmin approves them. One person = one account.
- Every staff action is audited (mock does it in `api.js`; the REAL server must write audit rows itself). Subadmin sees own clinic's audit; main admin sees all.
- Demo logins: staff `funke/staff123`, clinic admin `phc0142/clinic123`, main admin `admin/admin123`. Pending demos: staff `grace`, clinic `offa`.
- Passwords are plain text in the mock ONLY - hash them (bcrypt/argon2) and enforce roles on the server.
 
## Still to do (marked TODO in code)
Real payment gateway for Add money, staff login, staff-assisted patient registration, staff Vaccinations/Reports pages, server-side PIN/OTP checks, real hero image.
 
## v4 (money, roles, verification) – read `assets/js/api.js` header comments for every endpoint
- Four URLs: patients `index.html` • staff `/staff/` • clinic admin console `/clinic/` • main admin `/admin/login.html`.
- Main admin menus: Clinics, Clinic admins, Staff (search + filter by clinic), Patients, Complaints, Audit log, Messages. One clinic admin per clinic.
- Clinic admin console: Wallet (balance, withdraw, transactions), Refund requests, Staff approvals, Patients seen, Complaints, Audit log.
- Email verification (6-digit code) is required to register patients, staff and clinic admins. The mock shows the code on screen; the real server must email it.
- Invoice: staff list items (description, qty, unit price), total is automatic, patient approves with PIN, money goes patient wallet -> clinic wallet. Staff cannot see the clinic wallet or refund; they request refunds.
- Complaints go only to the named clinic's admin and the main admin.
- Demo: staff `funke/staff123`, clinic admin `phc0142/clinic123`, main admin `admin/admin123`; patient HP-0234-8891 PIN 1234.