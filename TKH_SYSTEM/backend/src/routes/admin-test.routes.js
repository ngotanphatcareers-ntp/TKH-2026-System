const express = require("express");

const authenticateToken = require(
  "../middleware/authenticate-token"
);

const requireRole = require(
  "../middleware/require-role"
);

const uploadExamQuestionsFile = require(
  "../middleware/upload-exam-questions"
);

const {
  getAdminExamsController,
  createExamController,
  deleteExamController,
  importExamQuestionsFromExcelController,
  openExamWaitingRoomController,
  closeExamWaitingRoomController,
  startExamController,
  finishExamController,
} = require(
  "../controllers/exam.controller"
);


const router = express.Router();


/*
=====================================================
All Admin Test routes require Admin authentication
=====================================================
*/

router.use(authenticateToken);
router.use(requireRole("ADMIN"));


/*
=====================================================
GET /api/admin/test/protected
Verify Admin access
=====================================================
*/

router.get(
  "/protected",
  (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        message: "Admin access granted",
      },
    });
  }
);


/*
=====================================================
GET /api/admin/test/exams
Get all exams in active season
=====================================================
*/

router.get(
  "/exams",
  getAdminExamsController
);



/*
=====================================================
POST /api/admin/test/exams
Create a new Exam
=====================================================
*/

router.post(
  "/exams",
  createExamController
);


/*
=====================================================
PATCH /api/admin/test/exams/:examId/open-waiting-room
=====================================================
*/

router.patch(
  "/exams/:examId/open-waiting-room",
  openExamWaitingRoomController
);



/*
=====================================================
PATCH /api/admin/test/exams/:examId/close-waiting-room
=====================================================
*/

router.patch(
  "/exams/:examId/close-waiting-room",
  closeExamWaitingRoomController
);

/*
=====================================================
PATCH /api/admin/test/exams/:examId/start
Start Exam
=====================================================
*/

router.patch(
  "/exams/:examId/start",
  startExamController
);


/*
=====================================================
PATCH /api/admin/test/exams/:examId/finish
Finish Exam
=====================================================
*/

router.patch(
  "/exams/:examId/finish",
  finishExamController
);


/*
=====================================================
DELETE /api/admin/test/exams/:examId
Delete one DRAFT Exam
=====================================================
*/

router.delete(
  "/exams/:examId",
  deleteExamController
);


/*
=====================================================
POST /api/admin/test/exams/:examId/questions/import
Import Exam questions from Excel
=====================================================
*/

router.post(
  "/exams/:examId/questions/import",
  uploadExamQuestionsFile,
  importExamQuestionsFromExcelController
);


module.exports = router;