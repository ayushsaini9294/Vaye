const { createClient } = require("@libsql/client");
const c = createClient({ url: "file:./vaye.db" });

async function main() {
  // Test search query
  const r = await c.execute(
    "SELECT id, username, display_name FROM users WHERE LOWER(username) LIKE '%liza%' OR LOWER(display_name) LIKE '%liza%'"
  );
  console.log("Search results for 'liza':", r.rows.length);
  r.rows.forEach((u) => console.log("  -", u.username, "(" + u.display_name + ")"));

  // Test search for 'ayush'
  const r2 = await c.execute(
    "SELECT id, username, display_name FROM users WHERE LOWER(username) LIKE '%ayush%' OR LOWER(display_name) LIKE '%ayush%'"
  );
  console.log("\nSearch results for 'ayush':", r2.rows.length);
  r2.rows.forEach((u) => console.log("  -", u.username, "(" + u.display_name + ")"));
}

main().catch(console.error);
