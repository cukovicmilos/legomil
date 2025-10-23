# Deployment konfiguracija

## Systemd servis

Aplikacija je podešena da se automatski pokreće pri startu servera pomoću systemd servisa.

### Lokacija servisa
`/etc/systemd/system/legomil.service`

### Sadržaj konfiguracije

```ini
[Unit]
Description=Legomil LEGO Set Tracker
After=network.target

[Service]
Type=simple
User=chule
WorkingDirectory=/var/www/html/legomil
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /var/www/html/legomil/server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/legomil.log
StandardError=append:/var/log/legomil-error.log

[Install]
WantedBy=multi-user.target
```

### Komande za upravljanje servisom

```bash
# Status servisa
systemctl status legomil.service

# Pokretanje servisa
systemctl start legomil.service

# Zaustavljanje servisa
systemctl stop legomil.service

# Restart servisa
systemctl restart legomil.service

# Omogućavanje automatskog pokretanja
systemctl enable legomil.service

# Onemogućavanje automatskog pokretanja
systemctl disable legomil.service

# Pregled logova
journalctl -u legomil.service -f
```

## Logrotate konfiguracija

Logovi se automatski rotiraju da bi se sprečio prekomeran rast fajlova.

### Lokacija konfiguracije
`/etc/logrotate.d/legomil`

### Sadržaj konfiguracije

```
/var/log/legomil.log /var/log/legomil-error.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 chule chule
    sharedscripts
    postrotate
        systemctl reload legomil.service > /dev/null 2>&1 || true
    endscript
}
```

### Karakteristike rotacije

- **Frekvencija**: Dnevno (svaki dan u ponoć)
- **Retencija**: 7 dana
- **Kompresija**: Stari logovi se kompresuju (gzip)
- **Delay compress**: Najnoviji rotiran log ostaje nekompresovan
- **Maksimalna veličina**: ~5-10 KB (sa trenutnim nivoom logovanja)

### Testiranje logrotate konfiguracije

```bash
# Dry-run test
logrotate -d /etc/logrotate.d/legomil

# Verbose test
logrotate -v /etc/logrotate.d/legomil

# Manuelna rotacija (force)
logrotate -f /etc/logrotate.d/legomil
```

## Log fajlovi

- **Standardni output**: `/var/log/legomil.log`
- **Greške**: `/var/log/legomil-error.log`

### Pregled logova

```bash
# Poslednjih 50 linija
tail -50 /var/log/legomil.log

# Real-time praćenje
tail -f /var/log/legomil.log

# Pregled error logova
tail -f /var/log/legomil-error.log
```

## Nginx reverse proxy

Aplikacija radi na portu 3005 i izložena je preko Nginx reverse proxy-ja.

### Nginx konfiguracija
Lokacija: `/etc/nginx/sites-available/`

Detalje o Nginx konfiguraciji možete pronaći u odgovarajućim konfiguracionim fajlovima.

## Prvo podešavanje na novom serveru

1. Klonirati repozitorijum:
   ```bash
   cd /var/www/html
   git clone <repository-url> legomil
   cd legomil
   ```

2. Instalirati zavisnosti:
   ```bash
   npm install
   ```

3. Kreirati `.env` fajl sa odgovarajućim vrednostima:
   ```bash
   REBRICKABLE_API_KEY=your_api_key
   AUTH_USERNAME=your_username
   AUTH_PASSWORD=your_password
   SESSION_SECRET=your_secret_key
   ```

4. Kreirati systemd servis (kopiraj sadržaj iz DEPLOYMENT.md):
   ```bash
   sudo nano /etc/systemd/system/legomil.service
   ```

5. Kreirati log fajlove:
   ```bash
   sudo touch /var/log/legomil.log /var/log/legomil-error.log
   sudo chown chule:chule /var/log/legomil*.log
   ```

6. Omogućiti i pokrenuti servis:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable legomil.service
   sudo systemctl start legomil.service
   ```

7. Kreirati logrotate konfiguraciju (kopiraj sadržaj iz DEPLOYMENT.md):
   ```bash
   sudo nano /etc/logrotate.d/legomil
   ```

8. Verifikacija:
   ```bash
   systemctl status legomil.service
   curl http://localhost:3005
   ```
