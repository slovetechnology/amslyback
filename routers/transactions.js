const { AllUserTransactions, AdminGetAllTransactions } = require('../controllers/transactions')
const { UserRoutes, AdminRoutes } = require('../middleware/AuthMiddleware')

const router = require('express').Router()

router.get('/user/all', UserRoutes, AllUserTransactions)
router.get('/admin/all', AdminRoutes, AdminGetAllTransactions)

module.exports = router