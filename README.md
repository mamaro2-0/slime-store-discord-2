# SLIME STORE — Discord Order Notifications

A small Node.js + Express backend that sends submitted orders to a Discord channel through a Discord webhook.

## Requirements
- Node.js 18 or newer
- A Discord webhook URL kept private in environment variables

## Run locally
```bash
npm install
npm start
```
Open `http://localhost:3000`.

## Environment variables
Set `DISCORD_WEBHOOK_URL` to your **full** Discord webhook URL in your hosting provider's Secrets / Environment Variables section. `PORT` is optional; most hosts provide it automatically.

Do not commit `.env`, paste the webhook into HTML, or share the webhook URL publicly. If it has been exposed, delete/rotate it in Discord and create a new webhook.

## Deploying
Connect this repository to a Node.js host such as Render. Use:
- Build command: `npm install`
- Start command: `npm start`
- Environment variable: `DISCORD_WEBHOOK_URL` = your new private webhook URL

## Important payment note
This project only sends order notifications to Discord. It does **not** verify GCash, Maya, GoTyme, or PayPal payments and does **not** automatically deliver keys. Check payment in the official payment app yourself before delivering any product.
