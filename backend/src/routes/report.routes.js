const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { getReports, getReportById, deleteReport } = require("../controllers/report.controller");

const router = express.Router();

router.use(protect);

router.get("/", getReports);
router.get("/:id", getReportById);
router.delete("/:id", deleteReport);

module.exports = router;
