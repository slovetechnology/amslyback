const { AllUserTransactions, AdminGetAllTransactions, AdminFiltersTransactions, UserFilterTransactions, AdminGetSalesAnalysis } = require('../controllers/transactions')
const { UserRoutes, AdminRoutes } = require('../middleware/AuthMiddleware')

const router = require('express').Router()

router.get('/user/all', UserRoutes, AllUserTransactions)
router.get('/admin/all', AdminRoutes, AdminGetAllTransactions)
router.post('/admin/filter-transactions', AdminRoutes, AdminFiltersTransactions)
router.post('/user/filter-transactions', UserRoutes, UserFilterTransactions)
router.get('/admin-sales', AdminGetSalesAnalysis)

module.exports = router