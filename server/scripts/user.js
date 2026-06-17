#!/usr/bin/env node
import {
  createUser,
  deleteUser,
  listUsers,
} from '../auth.js';

function usage() {
  console.log(`Usage:
  node server/scripts/user.js create <username> <password>
  node server/scripts/user.js delete <username>
  node server/scripts/user.js list`);
}

const [,, command, username, password] = process.argv;

try {
  switch (command) {
    case 'create':
      if (!username || !password) {
        usage();
        process.exit(1);
      }
      createUser(username, password);
      console.log(`Created user: ${username}`);
      break;

    case 'delete':
      if (!username) {
        usage();
        process.exit(1);
      }
      deleteUser(username);
      console.log(`Deleted user: ${username}`);
      break;

    case 'list':
      for (const user of listUsers()) {
        console.log(`${user.id}\t${user.username}\t${user.created_at}`);
      }
      break;

    default:
      usage();
      process.exit(command ? 1 : 0);
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
