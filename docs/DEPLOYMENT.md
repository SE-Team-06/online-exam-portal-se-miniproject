# Linux server deployment

This guide deploys the React static bundle and Express API on one Linux server. It assumes a Debian or Ubuntu host with a DNS name, TLS certificate, and a MongoDB service. Allow about 45 minutes for a first deployment when the server and DNS are ready; certificate issuance and firewall/DNS changes can take longer.

## Requirements

- Node.js 22.12 or newer and npm (the repository's `engines` field is authoritative).
- MongoDB 7 or newer, reachable from the API host. Use an authenticated database and keep it off the public network.
- nginx (or an equivalent reverse proxy), a domain name, and a TLS certificate. The API enforces HTTPS in production.
- Git and a dedicated unprivileged Linux service account. Build tools are only needed if the deployment host cannot use prebuilt Node packages.

## Install and build

Run as the deployment account. Replace the repository URL and path with your team's values.

```sh
sudo adduser --system --group --home /srv/online-exam-portal oep
sudo -u oep git clone <repository-url> /srv/online-exam-portal/app
cd /srv/online-exam-portal/app
npm ci
npm run build
```

The build creates `client/dist`; nginx serves these static files. The API runs from the `server` workspace. Keep the repository owned by the service account and do not expose the Node port publicly.

## Configure the API

Create `/etc/online-exam-portal.env`, owned by root and readable by the service account, with these values (replace every example):

```dotenv
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://oep_user:<encoded-password>@127.0.0.1:27017/online_exam_portal?authSource=admin
APP_ORIGIN=https://exam.example.edu
REQUIRE_HTTPS=true
SESSION_INACTIVITY_MINUTES=30
BACKUP_DIR=/var/backups/online-exam-portal
BACKUP_INTERVAL_HOURS=24
BACKUP_RETAIN=7
```

`MONGODB_URI` is required. `PORT` defaults to 4000; `APP_ORIGIN` must be the deployed site's exact origin. `NODE_ENV=production` enforces HTTPS and Secure session cookies; TLS must terminate at the proxy. `SESSION_INACTIVITY_MINUTES` defaults to 30. Registration and password-reset email require `SMTP_URL` (a Nodemailer SMTP connection URL) and `MAIL_FROM`; without them, registration returns an email-delivery error and reset requests do not send a link. Use a dedicated mail account, keep its URL outside the repository, and verify delivery and link expiry in the target environment. `BACKUP_DIR` enables scheduled backups; when enabled, create that directory and grant the service account write access. The backup settings default to 24 hours and seven retained files. Store credentials outside the repository and URL-encode special characters in the MongoDB password.

If configuring via dotenv instead of a service manager, put the file at `server/.env` because npm runs the server with that workspace as its working directory. Do not commit it.

## Run as a systemd service

Create `/etc/systemd/system/online-exam-portal.service`:

```ini
[Unit]
Description=Online Exam Portal API
After=network-online.target mongod.service
Wants=network-online.target

[Service]
Type=simple
User=oep
Group=oep
WorkingDirectory=/srv/online-exam-portal/app/server
EnvironmentFile=/etc/online-exam-portal.env
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Adjust `ExecStart` to the installed Node binary path (`command -v node`). Then start the service:

```sh
sudo install -d -o oep -g oep /var/backups/online-exam-portal
sudo systemctl daemon-reload
sudo systemctl enable --now online-exam-portal
sudo systemctl status online-exam-portal
curl -fsS http://127.0.0.1:4000/api/health
```

The health endpoint reports database connectivity and should return `{"status":"ok","database":"up",...}`.

## Configure nginx and TLS

Point the domain's TLS virtual host at the built files and proxy `/api/` to the API. Install a valid certificate before enabling the HTTPS virtual host. For example, inside the TLS server block:

```nginx
root /srv/online-exam-portal/app/client/dist;
index index.html;

location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

Configure port 80 to redirect to HTTPS, restrict the firewall to SSH and web traffic, and keep port 4000 and MongoDB private. The app trusts one proxy hop; do not put additional untrusted proxies between nginx and the app. Reload nginx and verify `https://exam.example.edu/api/health`, registration email delivery, verification expiry, reset expiry, and browser login. Administrator-created accounts can also be managed in the admin workspace.

## Upgrade and operations

For an upgrade, pull the approved revision as `oep`, run `npm ci && npm run build`, then restart the service with `sudo systemctl restart online-exam-portal`. Review service logs with `sudo journalctl -u online-exam-portal`. Backups are written under `BACKUP_DIR`; verify an off-host copy and practice restore using the operational commands in [`OPERATIONS.md`](OPERATIONS.md). This guide documents setup but no production deployment has been performed or independently verified by this change.
