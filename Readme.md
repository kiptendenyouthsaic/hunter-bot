<div align="center">

## HUNTER_254 BOT

[![Made with Baileys](https://img.shields.io/badge/Made%20with-Baileys-00bcd4?style=for-the-badge)](https://github.com/WhiskeySockets/Baileys)[![Node.js](https://img.shields.io/badge/Node.js-CommonJS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<img src="utils/bot_image.jpg" alt="HUNTER_254 BOT" width="260"> </div>

HUNTER_254 BOT is a modular WhatsApp MD bot built with the Baileys library. The bot uses command modules, group-management tools, media utilities, games, AI integrations, and configurable owner controls.

> This project is independent and unofficial software. It is not affiliated with or endorsed by WhatsApp.

## Features

The bot includes administrator and owner commands, anti-link and anti-tag controls, welcome and goodbye messages, warnings, group statistics, stickers, media downloads, text effects, games, translation, weather, AI commands, status handling, and configurable auto-reaction and auto-status features. Commands are organized under the `commands/` directory and can be customized without changing the main message-processing flow.

The bot configuration is defined in `config.js`. The default bot name is `HUNTER_254 BOT`, the command prefix is `>`, the timezone is `Africa/Nairobi`, and the default owner number is configured for the project owner. Review these values before deployment.

## Session Configuration

The bot reads the session from the `SESSION_ID` environment variable:

```
SESSION_ID=HunterBot!<base64-compressed-session-data>
```

The value must be the complete session string, including the `HunterBot!` prefix. Do not commit a real session string to GitHub or place it directly in public source code.

For local development, create a `.env` file or export the variable in your shell. The application reads environment variables through Node.js at startup; if your local environment does not automatically load `.env` files, export the value explicitly:

```bash
export SESSION_ID='HunterBot!your_session_string_here'
npm start
```

If `SESSION_ID` is empty, the bot falls back to QR authentication and prints the QR code in the terminal. QR-based authentication is suitable for local use, but a Render restart may remove generated session files, so Render deployments should use `SESSION_ID`.

## Render Web Service Deployment

This repository includes `render.yaml` and is configured as a Render Web Service. The service exposes `/health`, listens on Render’s `PORT` value, and binds to `0.0.0.0` so Render can reach the application.

### Deploy with Render Blueprint

Push the project to a GitHub or GitLab repository. In Render, create a new Blueprint and select the repository. Render will read `render.yaml` and use the following commands:

```
Build Command: npm ci
Start Command: npm start
Health Check Path: /health
```

In the Render service’s Environment settings, add the secret variable below:

| Variable | Required | Value |
| --- | --- | --- |
| `SESSION_ID` | Yes | The complete `HunterBot!…` session string. |
| `NODE_ENV` | No | `production`; configured automatically by `render.yaml`. |
| `SESSION_DIR` | No | `/tmp/whatsapp-session`; configured automatically by `render.yaml`. |

The health endpoint returns only service status and whether a session is configured. It does not return the session secret. Open the deployed service URL at `/health` to verify that the web service is responding.

### Manual Render Configuration

If you are not using the Blueprint, create a **Web Service** with these settings:

```
Runtime: Node
Build Command: npm ci
Start Command: npm start
Health Check Path: /health
```

Then add `SESSION_ID` as a secret environment variable. Do not add the session string to `config.js` in the repository.

## Local Setup

Clone the repository and install the locked dependencies:

```bash
git clone <your-repository-url>
cd <your-repository-directory>
npm ci
```

Configure the session and start the bot:

```bash
export SESSION_ID='HunterBot!your_session_string_here'
npm start
```

The package also provides a development command:

```bash
npm run dev
```

The bot’s package start script is `node index.js`. The `Procfile` also uses `node index.js` for platforms that recognize Procfiles.

## Project Structure

| Path | Purpose |
| --- | --- |
| `index.js` | Starts the health server and WhatsApp connection. |
| `config.js` | Bot name, prefix, owner, feature, and session configuration. |
| `handler.js` | Routes incoming messages to command handlers. |
| `commands/` | Modular bot commands grouped by feature. |
| `database/` | JSON data used by group settings, warnings, games, and statistics. |
| `utils/` | Media, cleanup, sticker, conversion, and helper utilities. |
| `render.yaml` | Render Web Service Blueprint. |
| `.env.example` | Safe environment-variable template. |

## Security and Usage Notice

Keep `SESSION_ID`, API keys, and generated authentication files private. Rotate the WhatsApp session if it is accidentally exposed. Use the bot only in compliance with applicable laws and WhatsApp’s terms. Do not use it for spam, harassment, bulk messaging, or other abusive activity.

This bot is provided for educational purposes. Third-party WhatsApp automation can result in account restrictions or bans, and the project authors are not responsible for misuse, service interruptions, or account actions.

## Credits and License

The project uses the Baileys library and other open-source dependencies listed in `package.json`. Preserve the original license and copyright notices when modifying or redistributing the project. The project is distributed under the MIT License where applicable.
