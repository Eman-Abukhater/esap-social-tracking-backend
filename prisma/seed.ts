import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.user.createMany({
    data: [
      {
        name: "Ahmed",
        email: "ahmed@esap.ai",
        role: "manager",
      },
      {
        name: "Sarah",
        email: "sarah@esap.ai",
        role: "contributor",
      },
      {
        name: "Omar",
        email: "omar@esap.ai",
        role: "admin",
      },
    ],
  });

  await prisma.product.createMany({
    data: [
      {
        name: "ESAP AI ERP",
        description: "AI-powered ERP system",
        color: "#2563eb",
      },
      {
        name: "Agent Builder",
        description: "AI Agent creation platform",
        color: "#16a34a",
      },
    ],
  });

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });