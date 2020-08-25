const router = require('express').Router();
const multer = require('multer');
const crypto = require('crypto');

const {
  AssignmentSchema,
  SubmissionSchema,
  insertAssignment,
  getAssignmentById,
  updateAssignmentById,
  deleteAssignmentById,
  getSubmissionsByAssignmentId,
  getSubmissionsByStudentId,
  createSubmission,
  getPath
} = require('../models/assignment');

const { requireAuthentication, verifyAuthentication } = require('../lib/auth');

const { getCourseDetailsById } = require('../models/course');

const { validateAgainstSchema } = require('../lib/validation');

const fileTypes = {
  'application/pdf': 'pdf'
};

const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/../uploads`,
    filename: (req, file, callback) => {
      const filename = crypto.pseudoRandomBytes(16).toString('hex');
      const extension = fileTypes[file.mimetype];
      callback(null, `${filename}.${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    callback(null, !!fileTypes[file.mimetype]);
  }
});

// get assignment by id
router.get('/:id', async (req, res, next) => {
  try {
    const assignment = await getAssignmentById(parseInt(req.params.id));
    if (assignment) {
      res.status(200).send(assignment);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error fetching assignment.  Please try again later.'
    });
  }
});

// create new assignment
router.post('/', requireAuthentication, async (req, res) => {
  try {
    const course = await getCourseDetailsById(req.params.courseId);
    if (
      req.role == 'admin' ||
      (req.role == 'instructor' && req.id == course.instructor_id)
    ) {
      if (validateAgainstSchema(req.body, AssignmentSchema)) {
        try {
          const id = await insertAssignment(req.body);
          res.status(201).send({
            id: id
          });
        } catch (err) {
          console.error(err);
          res.status(500).send({
            error: 'Error inserting assignment. Please try again later'
          });
        }
      } else {
        res.status(400).send({
          error: 'Request body is not a valid assignment object'
        });
      }
    } else {
      res.status(403).send({
        error: 'You are not authorized to post a new assignment.'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error inserting assignment. Please try again later.'
    });
  }
});

// update assignment by id
router.patch('/:id', requireAuthentication, async (req, res, next) => {
  try {
    const course = await getCourseDetailsById(req.params.course_id);
    if (
      req.role == 'admin' ||
      (req.role == 'instructor' && req.id == course.instructor_id)
    ) {
      try {
        const id = parseInt(req.params.id);
        const updateSuccessful = await updateAssignmentById(id, req.body);
        if (updateSuccessful) {
          res.status(200).send({
            links: {
              assignment: `/assignments/${id}`
            }
          });
        } else {
          console.log('dajfodsa');
          next();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: 'Unable to update assignment. Please try again later'
        });
      }
    } else {
      res.status(403).send({
        error: 'You are not authorized to update this assignment.'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error updating assignment. Please try again later.'
    });
  }
});

// delete particular assignment
router.delete('/:id', requireAuthentication, async (req, res, next) => {
  try {
    const assignment = await getAssignmentById(req.params.id);
    console.log(assignment);
    const course = await getCourseDetailsById(assignment.course_id);
    console.log(course);
    console.log(req.id);
    console.log(req.role);
    console.log(req);
    console.log(course.instructor_id);
    if (
      req.role == 'admin' ||
      (req.role == 'instructor' && req.user == course.instructor_id)
    ) {
      try {
        const deleteSuccessful = await deleteAssignmentById(
          parseInt(req.params.id)
        );
        if (deleteSuccessful) {
          res.status(204).end();
        } else {
          next();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: 'Unable to remove business. Please try again later.'
        });
      }
    } else {
      res.status(403).send({
        error: 'You are not authorized to delete this resource.'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error deleting assignment. Please try again later.'
    });
  }
});

// download file from a submission
router.get('/download/:filename', async (req, res, next) => {
  try {
    const path = await getPath(req.params.filename);
    console.log(path.file_path);
    //const path = '../uploads/' + req.params.filename);
    res.download(path.file_path);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error fetching file.  Please try again later.'
    });
  }
});

// get submission by assignment id
router.get('/:id/submissions', async (req, res, next) => {
  if (req.params.studentId) {
    try {
      console.log("user wants a specific student's submissions");
      const submissions = await getSubmissionsByAssignmentId(
        parseInt(req.params.id)
      );
      console.log(submissions);
      if (submissions.length > 0) {
        var response = [];
        submissions.forEach((submission) => {
          const responseItem = {
            id: submission.id,
            date: submission.submission_date,
            file_url: `/assignments/download/${submission.file_name}`,
            assignment_id: submission.assignment_id,
            student_id: submission.student_id
          };
          response.push(responseItem);
        });
        res.status(200).send(response);
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: 'Error fetching submission.  Please try again later.'
      });
    }
  } else {
    try {
      const submissions = await getSubmissionsByAssignmentId(
        parseInt(req.params.id)
      );
      console.log(submissions);
      if (submissions.length > 0) {
        var response = [];
        submissions.forEach((submission) => {
          const responseItem = {
            id: submission.id,
            date: submission.submission_date,
            file_url: `/assignments/download/${submission.file_name}`,
            assignment_id: submission.assignment_id,
            student_id: submission.student_id
          };
          response.push(responseItem);
        });
        res.status(200).send(response);
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: 'Error fetching submission.  Please try again later.'
      });
    }
  }
});

// create new submission
router.post(
  '/:id/submissions',
  upload.single('file'),
  async (req, res, next) => {
    if (validateAgainstSchema(req.body, SubmissionSchema)) {
      try {
        console.log('== req.file:', req.file);
        console.log('== req.body:', req.body);
        const submission = {
          assignment_id: parseInt(req.body.assignment_id),
          student_id: parseInt(req.body.student_id),
          file_name: req.file.filename,
          file_path: req.file.path
        };
        const id = await createSubmission(submission);
        res.status(200).send({
          id: id
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: 'Error creating submission. Please try again later'
        });
      }
    } else {
      res.status(400).send({
        error: 'Invalid request body.'
      });
    }
  }
);

module.exports = router;
