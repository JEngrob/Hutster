# Azure Setup - Quick Reference

## Lokal Test Før Deployment

Før du deployer til Azure, test at den kombinerede server virker lokalt:

### 1. Build Next.js App

```bash
npm run build
```

### 2. Start Combined Server

```bash
# Sæt environment variables
$env:NODE_ENV="production"
$env:PORT="3000"
$env:NEXT_PUBLIC_URL="http://localhost:3000"
$env:NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"

# Start serveren
npm run start:production
```

### 3. Test Applikationen

1. Åbn `http://localhost:3000` i browseren
2. Opret et spil som vært
3. Åbn en anden browser/incognito og join som spiller
4. Verificer at Socket.IO forbindelsen virker

## Azure Deployment

Se `azure-deploy.md` for komplette instruktioner.

### Hurtig Start

1. Opret Azure App Service (Free tier F1)
2. Sæt environment variables:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_URL=https://<din-app>.azurewebsites.net`
   - `NEXT_PUBLIC_SOCKET_URL=https://<din-app>.azurewebsites.net`
   - `PORT=8080` (Azure sætter dette automatisk)
3. Sæt startup command til: `npm run start:production`
4. Deploy kode via Git eller Azure CLI

## Troubleshooting

### Server starter ikke

- Tjek logs i Azure Portal > Log Stream
- Verificer at alle environment variables er sat
- Tjek at Node.js version matcher (18 eller 20)

### Socket.IO virker ikke

- Verificer at `NEXT_PUBLIC_SOCKET_URL` matcher frontend URL
- Tjek browser console for fejl
- Verificer at WebSockets er aktiveret (automatisk på Azure)

