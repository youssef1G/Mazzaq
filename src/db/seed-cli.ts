import { config } from "dotenv";

config();
config({ path: ".env.local", override: true });

async function main() {
  const { getDb } = await import("./index");
  const { seedDatabase } = await import("./seed");
  const db = await getDb();
  await seedDatabase(db);
  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
