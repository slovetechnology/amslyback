const { CreateNotify, UpdateNotify, GetNotify, DeleteNotify, SingleNotify } = require('../controllers/notify')
const { AdminRoutes, AllRoutes } = require('../middleware/AuthMiddleware') 

const router = require('express').Router()

router.post('/create-notify', AdminRoutes, CreateNotify)
router.put('/update-notify', AdminRoutes, UpdateNotify)
router.post('/delete-notify', AdminRoutes, DeleteNotify)
router.get('/notify', AllRoutes, GetNotify)
router.get('/notify/:id', AllRoutes, SingleNotify)


module.exports = router