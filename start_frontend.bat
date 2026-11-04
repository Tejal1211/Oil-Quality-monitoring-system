@echo off
cd /d "%~dp0frontend"
if not exist node_modules npm install
npx vite --host 127.0.0.1 --port 5173 --strictPort
