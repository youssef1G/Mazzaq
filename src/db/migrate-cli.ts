import { config } from "dotenv";

config();
config({ path: ".env.local", override: true });

async function main() {
  const { getDb } = await import("./index");
  await getDb();
  console.log("Database schema is up to date.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
