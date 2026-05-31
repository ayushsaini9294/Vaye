const {createClient} = require('./node_modules/@libsql/client');
const db = createClient({url: 'file:./vaye.db'});

async function main() {
  // Check users
  const users = await db.execute('SELECT id, username, display_name FROM users');
  console.log('Users:', JSON.stringify(users.rows, null, 2));

  // Check search query
  const pattern = '%liza%';
  const search = await db.execute({
    sql: 'SELECT id, username, display_name FROM users WHERE LOWER(username) LIKE ? OR LOWER(display_name) LIKE ?',
    args: [pattern, pattern]
  });
  console.log('\nSearch "liza":', JSON.stringify(search.rows, null, 2));

  // Check search for admin
  const pattern2 = '%ayush%';
  const search2 = await db.execute({
    sql: 'SELECT id, username, display_name FROM users WHERE LOWER(username) LIKE ? OR LOWER(display_name) LIKE ?',
    args: [pattern2, pattern2]
  });
  console.log('\nSearch "ayush":', JSON.stringify(search2.rows, null, 2));
}
main().catch(console.error);
