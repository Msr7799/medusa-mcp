import { mcpHandler } from "../dist/index.js";

export default async function handler(req, res) {
  return mcpHandler(req, res);
}
