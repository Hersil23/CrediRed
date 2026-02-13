import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose', 'nodemailer', 'bcryptjs', 'jsonwebtoken'],
};

export default nextConfig;
