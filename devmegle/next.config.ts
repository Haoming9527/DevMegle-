import type { NextConfig } from "next";
import { loadApiKeys } from "./src/lib/config";

loadApiKeys();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
