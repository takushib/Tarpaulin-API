CREATE TABLE users (
  id INT(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  role ENUM('admin', 'instructor', 'student') NOT NULL,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  PRIMARY KEY(id)
);

CREATE TABLE courses (
  id INT(11) NOT NULL AUTO_INCREMENT,
  subject_code varchar(255) NOT NULL,
  course_number varchar(255) NOT NULL,
  course_title varchar(255) NOT NULL,
  term varchar(255) NOT NULL,
  instructor_id INT(11) NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (instructor_id) REFERENCES users(id)
);

CREATE TABLE assignments (
  id INT(11) NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  points INT(11) NOT NULL,
  due_date DATETIME NOT NULL,
  course_id INT(11) NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE
);

CREATE TABLE submissions (
  id INT(11) NOT NULL AUTO_INCREMENT,
  submission_date TIMESTAMP DEFAULT current_timestamp() NOT NULL,
  file_name varchar(255) NOT NULL,
  file_path varchar(255) NOT NULL,
  assignment_id INT(11) NOT NULL,
  student_id INT(11) NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (assignment_id) REFERENCES assignments(id)
    ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE enrollments (
  id INT(11) NOT NULL AUTO_INCREMENT,
  student_id INT(11) NOT NULL,
  course_id INT(11) NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE
);

INSERT INTO users VALUES (
  1,
  'Bob Smith',
  'admin',
  'smithB@gmail.com',
  'hunter2'
);

INSERT INTO users VALUES (
  2,
  'John Adams',
  'student',
  'AdamsJ@gmail.com',
  'hunter2'
);

INSERT INTO users VALUES (
  3,
  'Rob Hess',
  'instructor',
  'HessR@gmail.com',
  'hunter2'
);

INSERT INTO courses VALUES (
  1,
  'CS',
  '493',
  'Cloud Application Development',
  'S20',
  3
);

INSERT INTO courses VALUES (
  2,
  'CS',
  '290',
  'Web Dev',
  'S20',
  3
);

INSERT INTO assignments VALUES (
  1,
  'Assignment 1',
  100,
  '2020-06-19',
  1
);

INSERT INTO assignments VALUES (
  2,
  'Final Project',
  250,
  '2020-06-13',
  2
);

INSERT INTO assignments VALUES (
  3,
  'Assignment 2',
  100,
  '2020-05-20',
  1
);

INSERT INTO enrollments VALUES (
  1,
  2,
  1
);

INSERT INTO enrollments VALUES (
  2,
  1,
  1
);
