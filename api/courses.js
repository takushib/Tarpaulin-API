const router = require('express').Router();
const { validateAgainstSchema } = require('../lib/validation');
const {
  CourseSchema,
  deleteCourseById,
  getAssignmentsByCourseId,
  getCourses,
  getCourseDetailsById,
  getRosterByCourseId,
  getStudentsByCourseId,
  insertNewCourse,
  updateCourseById,
  updateEnrollmentByCourseId
} = require('../models/course');

const { requireAuthentication, verifyAuthentication } = require('../lib/auth');

const { getUserByID } = require('../models/user');

router.get('/', async (req, res) => {
  const { page, subject, number, term } = req.query;
  try {
    const coursesPage = await getCourses(
      parseInt(page) || 1,
      subject,
      number,
      term
    );
    coursesPage.links = {};
    if (coursesPage.page < coursesPage.totalPages) {
      coursesPage.links.nextPage = `/courses?page=${coursesPage.page + 1}`;
      coursesPage.links.lastPage = `/courses?page=${coursesPage.totalPages}`;
    }
    if (coursesPage.page > 1) {
      coursesPage.links.prevPage = `/courses?page=${coursesPage.page - 1}`;
      coursesPage.links.firstPage = '/courses?page=1';
    }
    res.status(200).send(coursesPage);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error fetching courses list.  Please try again later.'
    });
  }
});

router.post('/', verifyAuthentication, async (req, res) => {
  if (validateAgainstSchema(req.body, CourseSchema)) {
    if (req.role != 'admin') {
      res.status(403).send({
        error: 'Only an admin can create new courses.'
      });
    }
    try {
      const id = await insertNewCourse(req.body);
      res.status(201).send({
        id: id,
        links: {
          course: `/courses/${id}`
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: 'Error inserting course into DB.  Please try again later.'
      });
    }
  } else {
    res.status(400).send({
      error: 'Request body is not a valid course object.'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await getCourseDetailsById(parseInt(req.params.id));
    if (course) {
      res.status(200).send(course);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Unable to fetch course.  Please try again later.'
    });
  }
});

router.patch('/:id', requireAuthentication, async (req, res) => {
  try {
    const course = await getCourseDetailsById(parseInt(req.params.id));
    if (course) {
      if (
        req.role == 'admin' ||
        (req.role == 'instructor' && req.user == course.instructor_id)
      ) {
        try {
          const id = parseInt(req.params.id);
          const updateSuccessful = await updateCourseById(id, req.body);
          if (updateSuccessful) {
            res.status(200).send({
              links: {
                course: `/courses/${id}`
              }
            });
          } else {
            next();
          }
        } catch (err) {
          console.error(err);
          res.status(500).send({
            error: 'Unable to update specified course.  Please try again later.'
          });
        }
      } else {
        res.status(403).send({
          error: 'You are not authorized to get this roster.'
        });
      }
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Unable to fetch course.  Please try again later.'
    });
  }
});

router.delete('/:id', verifyAuthentication, async (req, res, next) => {
  if (req.role != 'admin') {
    res.status(403).send({
      error: 'Only an admin can remove courses.'
    });
  }
  try {
    const deleteSuccessful = await deleteCourseById(parseInt(req.params.id));
    if (deleteSuccessful) {
      res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Unable to delete course.  Please try again later.'
    });
  }
});

router.get('/:id/assignments', async (req, res) => {
  try {
    const assignments = await getAssignmentsByCourseId(parseInt(req.params.id));
    if (assignments) {
      res.status(200).send(assignments);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Unable to fetch assignments.  Please try again later.'
    });
  }
});

router.get('/:id/roster', requireAuthentication, async (req, res) => {
  if (
    req.role == 'admin' ||
    (req.role == 'instructor' && req.id == req.params.id)
  ) {
    try {
      const csv = await getRosterByCourseId(parseInt(req.params.id));
      if (csv) {
        res.setHeader('Content-disposition', 'attachment; filename=roster.csv');
        res.set('Content-Type', 'text/csv');
        res.status(200).send(csv);
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: 'Unable to fetch course roster.  Please try again later.'
      });
    }
  } else {
    res.status(403).send({
      error: 'You are not authorized to get this roster.'
    });
  }
});

router.get('/:id/students', requireAuthentication, async (req, res) => {
  if (
    req.role == 'admin' ||
    (req.role == 'instructor' && req.id == req.params.id)
  ) {
    try {
      const students = await getStudentsByCourseId(parseInt(req.params.id));
      if (students) {
        res.status(200).send(students);
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: 'Unable to fetch students.  Please try again later.'
      });
    }
  } else {
    res.status(403).send({
      error: 'You are not authorized to get this roster.'
    });
  }
});

router.post('/:id/students', requireAuthentication, async (req, res) => {
  if (
    req.role == 'admin' ||
    (req.role == 'instructor' && req.id == req.params.id)
  ) {
    const { add, remove } = req.body;
    try {
      await updateEnrollmentByCourseId(parseInt(req.params.id), add, remove);
      res.sendStatus(201);
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: 'Error inserting course into DB.  Please try again later.'
      });
    }
  } else {
    res.status(403).send({
      error: 'You are not authorized to get this roster.'
    });
  }
});

module.exports = router;
