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