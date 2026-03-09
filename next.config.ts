import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tắt React Compiler để tránh lỗi với Turbopack
  // reactCompiler: true,
  output: "standalone",
  // Tắt Turbopack nếu cần (dùng webpack thay thế)
  // turbopack: false,
};

export default nextConfig;
