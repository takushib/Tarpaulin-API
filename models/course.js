const { getUserById } = require('./user');
const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');

const { getUserByID } = require('../models/user');

const CourseSchema = {
  subject_code: { required: true },
  course_number: { required: true },
  course_title: { required: true },
  term: { required: true },
  instructor_id: { required: true }
};
exports.CourseSchema = CourseSchema;

/*
 * Executes a MySQL query to fetch the total number of businesses.  Returns
 * a Promise that resolves to this count.
 */
async function getCoursesCount(filter, params) {
  const [results] = await mysqlPool.query(
    `SELECT COUNT(*) AS count FROM courses ${filter}`,
    params
  );
  return results[0].count;
}

/*
 * Executes a MySQL query to return a single page of businesses.  Returns a
 * Promise that resolves to an array containing the fetched page of businesses.
 */
async function getCourses(page, subject, number, term) {
  /*
   * Compute last page number and make sure page is within allowed bounds.
   * Compute offset into collection.
   */

  let filter = 'WHERE 1 = 1';
  let params = [];
  if (subject) {
    filter += ' AND subject_code = ?';
    params.push(subject);
  }
  if (number) {
    filter += ' AND course_number = ?';
    params.push(number);
  }
  if (term) {
    filter += ' AND term = ?';
    params.push(term);
  }

  const count = await getCoursesCount(filter, params);
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  const [
    results
  ] = await mysqlPool.query(
    `SELECT * FROM courses ${filter} ORDER BY id LIMIT ?,?`,
    [...params, offset, pageSize]
  );

  return {
    courses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };
}
exports.getCourses = getCourses;

async function insertNewCourse(course) {
  course = extractValidFields(course, CourseSchema);
  const [result] = await mysqlPool.query('INSERT INTO courses SET ?', course);
  return result.insertId;
}
exports.insertNewCourse = insertNewCourse;

async function getStudentsByCourseId(id) {
  const [
    enrollments
  ] = await mysqlPool.query('SELECT * FROM enrollments WHERE course_id = ?', [
    id
  ]);
  return enrollments.map((enrollment) => enrollment.student_id);
}
exports.getStudentsByCourseId = getStudentsByCourseId;

async function getRosterByCourseId(id) {
  const studentIds = await getStudentsByCourseId(id);
  const students = await Promise.all(
    studentIds.map((studentId) => getUserByID(studentId))
  );
  return students
    .map(({ id, name, email }) => `${id},${name},${email}`)
    .join('\n');
}
exports.getRosterByCourseId = getRosterByCourseId;

async function updateEnrollmentByCourseId(
  courseId,
  addIds = [],
  removeIds = []
) {
  if (addIds.length) {
    const insertQuery =
      'INSERT INTO enrollments (student_id, course_id) VALUES ?';
    const values = addIds.map((id) => [id, courseId]);
    await mysqlPool.query(insertQuery, [values]);
  }

  if (removeIds.length) {
    const removeQuery = 'DELETE FROM enrollments WHERE student_id IN (?)';
    await mysqlPool.query(removeQuery, [removeIds]);
  }
}
exports.updateEnrollmentByCourseId = updateEnrollmentByCourseId;

async function getAssignmentsByCourseId(id) {
  const [
    assignments
  ] = await mysqlPool.query('SELECT * FROM assignments WHERE course_id = ?', [
    id
  ]);
  return assignments;
}
exports.getAssignmentsByCourseId = getAssignmentsByCourseId;

async function getCourseDetailsById(id) {
  const [course] = await mysqlPool.query('SELECT * FROM courses WHERE id = ?', [
    id
  ]);
  const students = await getStudentsByCourseId(id);
  const assignments = await getAssignmentsByCourseId(id);
  return {
    ...course[0],
    students,
    assignments
  };
}
exports.getCourseDetailsById = getCourseDetailsById;

async function updateCourseById(id, course) {
  course = extractValidFields(course, CourseSchema);
  const [result] = await mysqlPool.query('UPDATE courses SET ? WHERE id = ?', [
    course,
    id
  ]);
  return result.affectedRows > 0;
}
exports.updateCourseById = updateCourseById;

async function deleteCourseById(id) {
  const [result] = await mysqlPool.query('DELETE FROM courses WHERE id = ?', [
    id
  ]);
  return result.affectedRows > 0;
}
exports.deleteCourseById = deleteCourseById;
