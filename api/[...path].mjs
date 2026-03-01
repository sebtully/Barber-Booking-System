import 'dotenv/config';
import { requestHandler } from '../backend/app.mjs';

export default async function handler(req, res) {
  await requestHandler(req, res);
}
