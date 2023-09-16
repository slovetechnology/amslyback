const { DataBills, AirtimeBill, VerifyIUCNumber, CableBill, VerifyMeterNumber, ElectricityBill, ExamBill } = require('../controllers/bills')
const { UserRoutes } = require('../middleware/AuthMiddleware')

const router = require('express').Router()

router.post('/data', UserRoutes, DataBills)
router.post('/airtime', UserRoutes, AirtimeBill)
router.post('/cable', UserRoutes, CableBill)
router.post('/verify-iuc', UserRoutes, VerifyIUCNumber)
router.post('/verify-meter', UserRoutes, VerifyMeterNumber)
router.post('/electricity', UserRoutes, ElectricityBill)
router.post('/exam', UserRoutes, ExamBill)

module.exports = router