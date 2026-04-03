import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx --tsconfig tsconfig.seed.json prisma/seed.ts",
  },
});
