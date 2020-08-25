const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { validateAgainstSchema } = require('../lib/validation');

const {
  UserSchema,
  LoginSchema,
  insertNewUser,
  getUserByID,
  getUserByEmail,
  getCoursesByUserID
} = require('../models/user');

const {
  generateAuthToken,
  requireAuthentication,
  verifyAuthentication
} = require('../lib/auth');

router.post('/', verifyAuthentication, async (req, res) => {
  try {
    if (validateAgainstSchema(req.body, UserSchema)) {
      if (
        (req.body.role == 'instructor' || req.body.role == 'admin') &&
        req.role != 'admin'
      ) {
        res.status(403).send({
          error:
            'User lacks required authentication criteria to create a new instructor or admin.'
        });
        return;
      }

      const existingUser = await getUserByEmail(req.body.email);
      if (existingUser) {
        res.status(400).send({
          error: 'This email is already in use.'
        });
        return;
      }

      const id = await insertNewUser(req.body);
      res.status(201).send({
        id: id
      });
    } else {
      res.status(400).send({
        error: 'Request body does not contain a valid user.'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Unable to register user. Please try again later.'
    });
  }
});

router.post('/login', async (req, res) => {
  if (validateAgainstSchema(req.body, LoginSchema)) {
    try {
      const user = await getUserByEmail(req.body.email);
      if (user && bcrypt.compare(req.body.password, user.password)) {
        const token = generateAuthToken(user.id, user.role);
        res.status(200).send({
          token: token
        });
      } else {
        res.status(401).send({
          error: 'Invalid authentication credentials.'
        });
      }
    } catch (err) {
      console.error('== error:', err);
      res.status(500).send({
        error: 'Error logging in. Please try again later.'
      });
    }
  } else {
    res.status(400).send({
      error: 'Request body needs both user ID and password'
    });
  }
});

router.get('/:id', requireAuthentication, async (req, res, next) => {
  if (req.params.id != req.user) {
    console.log(req.params.id, req.user);
    res.status(403).send({
      error: 'You do not have access to the requested resource.'
    });
    return;
  }
  try {
    const user = await getUserByID(req.params.id, false);
    console.log({ user });

    if (user.role === 'student') {
      const enrollments = await getCoursesByUserID(user.id);
      res.status(200).send({
        user: user,
        enrollments: enrollments
      });
    } else if (user.role === 'instructor') {
      const taughtCourses = await getCoursesByUserID(user.id);
      console.log({ taughtCourses });
      res.status(200).send({
        user: user,
        taughtCourses: taughtCourses
      });
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Unable to fetch user, please try again later.'
    });
  }
});

module.exports = router;
