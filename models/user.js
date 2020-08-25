const bcrypt = require('bcryptjs');
const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');

const UserSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  role: { required: false }
};
exports.UserSchema = UserSchema;

const LoginSchema = {
  email: { required: true },
  password: { required: true }
};
exports.LoginSchema = LoginSchema;

async function insertNewUser(user) {
  const userToInsert = extractValidFields(user, UserSchema);
  userToInsert.password = await bcrypt.hash(userToInsert.password, 8);
  const [results] = await mysqlPool.query('INSERT INTO users SET ?', [
    userToInsert
  ]);
  return results.insertId;
}
exports.insertNewUser = insertNewUser;

async function getUserByID(id, includePassword = true) {
  const [results] = await mysqlPool.query(
    'SELECT * FROM users WHERE id = ?',
    id
  );

  if (includePassword) {
    return results[0];
  } else {
    user = results[0];
    delete user.password;
    return user;
  }
}
exports.getUserByID = getUserByID;

async function getUserByEmail(email, includePassword = true) {
  const [results] = await mysqlPool.query(
    'SELECT * FROM users WHERE email = ?',
    email
  );

  const user = results[0];
  if (!includePassword) {
    delete user.password;
  }
  return user;
}
exports.getUserByEmail = getUserByEmail;

async function getCoursesByUserID(id) {
  const [results] = await mysqlPool.query(
    'SELECT * FROM enrollments WHERE student_id = ?',
    id
  );

  return results[0];
}
exports.getCoursesByUserID = getCoursesByUserID;
