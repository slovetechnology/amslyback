const { AllUserTransactions, AdminGetAllTransactions, AdminFiltersTransactions } = require('../controllers/transactions')
const { UserRoutes, AdminRoutes } = require('../middleware/AuthMiddleware')

const router = require('express').Router()

router.get('/user/all', UserRoutes, AllUserTransactions)
router.get('/admin/all', AdminRoutes, AdminGetAllTransactions)
router.post('/admin/filter-transactions', AdminRoutes, AdminFiltersTransactions)

module.exports = router