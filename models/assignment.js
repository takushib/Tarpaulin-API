const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');

const AssignmentSchema = {
  title: { required: true },
  points: { required: true },
  due_date: { required: true },
  course_id: { required: true }
};
exports.AssignmentSchema = AssignmentSchema;

const SubmissionSchema = {
  assignment_id: { required: true },
  student_id: { required: true }
};
exports.SubmissionSchema = SubmissionSchema;

////     /assignments/{id} functions

// create a new assignment
async function insertAssignment(assignment) {
  assignment = extractValidFields(assignment, AssignmentSchema);
  const [result] = await mysqlPool.query(
    'INSERT INTO assignments SET ?',
    assignment
  );

  return result.insertId;
}
exports.insertAssignment = insertAssignment;

// get assignment by id
async function getAssignmentById(id) {
  console.log({ id });
  const [
    results
  ] = await mysqlPool.query('SELECT * FROM assignments WHERE id = ?', [id]);
  return results[0];
}
exports.getAssignmentById = getAssignmentById;

// update an assignment
async function updateAssignmentById(id, assignment) {
  assignment = extractValidFields(assignment, AssignmentSchema);
  const [
    result
  ] = await mysqlPool.query('UPDATE assignments SET ? WHERE id = ?', [
    assignment,
    id
  ]);
  return result.affectedRows > 0;
}
exports.updateAssignmentById = updateAssignmentById;

// delete particular assignment
async function deleteAssignmentById(id) {
  const [result] = await mysqlPool.query(
    'DELETE FROM assignments WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}
exports.deleteAssignmentById = deleteAssignmentById;

// *********   /assignments/{id}/submissions functions   ********//

// get list of submissions for particular assignment
async function getSubmissionsByAssignmentId(assignmentId) {
  const [
    results
  ] = await mysqlPool.query(
    'SELECT * FROM submissions WHERE assignment_id = ?',
    [assignmentId]
  );
  return results;
}
exports.getSubmissionsByAssignmentId = getSubmissionsByAssignmentId;

async function getSubmissionsByStudentId(assignmentId, studentId) {
  const [
    results
  ] = await mysqlPool.query(
    'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?',
    [assignmentId, studentId]
  );
  return results;
}

// create a new submission for an assignment
async function createSubmission(submission) {
  const [result] = await mysqlPool.query(
    'INSERT INTO submissions SET ?',
    submission
  );
  return result.insertId;
}
exports.createSubmission = createSubmission;

// get file path for download
async function getPath(filename) {
  const [
    result
  ] = await mysqlPool.query(
    'SELECT file_path FROM submissions WHERE file_name = ?',
    [filename]
  );
  return result[0];
}
exports.getPath = getPath;
