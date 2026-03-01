import 'dotenv/config';
import http from 'node:http';
import { requestHandler, runtimeInfo } from './app.mjs';

const PORT = Number(process.env.PORT || 3001);

const server = http.createServer((req, res) => {
  void requestHandler(req, res);
});

server.listen(PORT, () => {
  console.log(`Barber backend listening on http://localhost:${PORT}`);
  console.log(`Storage: ${runtimeInfo.storageMode}${runtimeInfo.storageDatabase ? ` (${runtimeInfo.storageDatabase})` : ''}`);
  console.log(`Admin login email: ${runtimeInfo.adminUser.email}`);
  if (runtimeInfo.emailEnabled) {
    console.log(`Request emails enabled via ${runtimeInfo.smtpHost}:${runtimeInfo.smtpPort}`);
  } else {
    console.log('Request emails disabled: set SMTP_USER, SMTP_PASS and MAIL_TO to enable.');
  }
});
