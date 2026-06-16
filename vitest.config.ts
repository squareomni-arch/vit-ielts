import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  } as any,
});

