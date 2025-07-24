import { handler } from './build/handler.js';

export default function createServer(httpsServer) {
  return handler;
}