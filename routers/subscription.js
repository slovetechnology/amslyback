const { AdminCreateSubscription, AdminDeleteSubscription, AdminUpdateSubscriptionData, AllSubscriptions, AdminGetSubscriptiondata, AdminEditSubscription, AdminUpdateSubLocks, AdminAddAutomationService, AdminGetAllAutomationServices, AdminDeleteSubscriptionData, AdminDeleteAutomationService, AdminUpdateAutomationService, AdminGetSingleAutomationServices, UpdateSinglePackageAutomation, UserFetchAutomationServiceFromPackage, AdminAddApiPlans, AdminUpdateApiPlans, AdminGetAllApiPlans, AdminGetSingleApiPlan, CreateLevel, CreateAirtimeAutomation, AdminGetAllArtimeAutomationService, AdminGetAllCableAutomationService, CreateCableAutomation, AdminGetAllElectricityAutomationService, CreateElectricityAutomation, AdminGetAllExamAutomationService, CreateExamAutomation, FetchSingleLevel, FetchLevels, UpgradeUserLevel, OffAutomationService, UpdateLevel, DeleteLevelByAdmin, GetOtherAutomationServices } = require('../controllers/SubController')
const { AdminRoutes, AllRoutes, UserRoutes } = require('../middleware/AuthMiddleware')

const router = require('express').Router()

router.post('/create-subscription', AdminRoutes, AdminCreateSubscription)
router.get('/all-subscriptions', AllRoutes, AllSubscriptions)
router.get('/all-subscriptiondata/:id', AdminRoutes, AdminGetSubscriptiondata)
router.post('/delete-subscription', AdminRoutes, AdminDeleteSubscription)
router.post('/update-subscriptiondata', AdminRoutes, AdminUpdateSubscriptionData)
router.post('/delete-subscriptiondata', AdminRoutes, AdminDeleteSubscriptionData)
router.post('/edit-subscription', AdminRoutes, AdminEditSubscription)

router.post('/subscription-locks', AdminRoutes, AdminUpdateSubLocks)

router.post('/add-subscription-service', AdminRoutes, AdminAddAutomationService)
router.post('/update-subscription-service', AdminRoutes, AdminUpdateAutomationService)
router.get('/get-automation-services', AdminRoutes, AdminGetAllAutomationServices)
router.get('/get-single-automation-service/:id', AdminRoutes, AdminGetSingleAutomationServices)
router.post('/delete-automation-services', AdminRoutes, AdminDeleteAutomationService)
router.post('/suspend-automation-service-for-package', AdminRoutes, OffAutomationService)
router.get('/other-automation-service/:id/:tag/:aut', GetOtherAutomationServices)

router.post('/update-package-autmation', AdminRoutes, UpdateSinglePackageAutomation)
router.get('/user-get-automation/:id', UserRoutes, UserFetchAutomationServiceFromPackage)

router.post('/add-api-plans', AdminRoutes, AdminAddApiPlans)
router.post('/update-api-plans', AdminRoutes, AdminUpdateApiPlans)
router.get('/all-api-plans/:id', AdminRoutes, AdminGetAllApiPlans)
router.get('/single-api-plans/:id', AdminRoutes, AdminGetSingleApiPlan)

router.post('/add-level-plan', AdminRoutes, CreateLevel)
router.post('/update-level-plan', AdminRoutes, UpdateLevel)
router.post('/delete-level-plan', AdminRoutes, DeleteLevelByAdmin)
router.get('/single-level/:id', AdminRoutes, FetchSingleLevel)
router.get('/all-levels', FetchLevels)
router.post('/upgrade-account-level', AdminRoutes, UpgradeUserLevel)

router.get('/get-all-airtime-automations', AdminGetAllArtimeAutomationService)
router.post('/airtime-automation', AdminRoutes, CreateAirtimeAutomation)

router.get('/get-all-cable-automations', AdminGetAllCableAutomationService)
router.post('/cable-automation', AdminRoutes, CreateCableAutomation)

router.get('/get-all-exam-automations', AdminGetAllExamAutomationService)
router.post('/exam-automation', AdminRoutes, CreateExamAutomation)

router.get('/get-all-electricity-automations', AdminGetAllElectricityAutomationService)
router.post('/electricity-automation', AdminRoutes, CreateElectricityAutomation)

module.exports = router;