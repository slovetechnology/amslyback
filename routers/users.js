const { UserSignup, VerifySignupWithOtp, ResetVerificationOTP, UserLogin, FetchuserAccount, UserLogout, SetupAccessPin, ConfirmAdminLoginAccess, AdminFetchAllUsersMobile, AdminFetchAllUsersEmails, AdminBlockUserAccount, AdminAddContactInfo, AdminGetContactInfo, CreatDataPin, AdminUpdateUserpassword, AdminFetchAllUsers, AdminFinanceUser, AdminUpdateUserpin, FetchMyDownliners, AdminDashboard, KycUpload, UpdateUserKyc, DeleteKycDocument } = require('../controllers/users')
const { UserRoutes, AdminRoutes, AllRoutes } = require('../middleware/AuthMiddleware')

const router = require('express').Router()
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6InVzZXIiLCJpYXQiOjE2OTg0NjgxMDksImV4cCI6MTY5ODUxMTMwOX0.dUTBost95TOvT_mZW2YbNNM33VVFN7UQSXt5GoN-huA

router.post('/user-register', UserSignup)
router.post('/verify-otp', VerifySignupWithOtp)
router.post('/resend-otp', ResetVerificationOTP)
router.post('/user-login', UserLogin)
router.post('/user-logout', AllRoutes, UserLogout)
router.get('/', UserRoutes, FetchuserAccount)
router.get('/all-downliners', UserRoutes, FetchMyDownliners)
router.get('/admin', AdminRoutes, FetchuserAccount)
router.post('/setup-pin', AllRoutes, SetupAccessPin)
router.post('/confirm-access', ConfirmAdminLoginAccess)
router.get('/all-mobiles', AdminRoutes, AdminFetchAllUsersMobile)
router.get('/all-emails', AdminRoutes, AdminFetchAllUsersEmails)
router.get('/all-users', AdminFetchAllUsers)
router.post('/block-account', AdminRoutes, AdminBlockUserAccount)
router.post('/contact-info', AdminRoutes, AdminAddContactInfo)
router.get('/get-contact-info', AdminRoutes, AdminGetContactInfo)
router.post('/create-transaction-pin', UserRoutes, CreatDataPin)
router.post('/update-user-password', AdminRoutes, AdminUpdateUserpassword)
router.post('/update-user-pin', AdminRoutes, AdminUpdateUserpin)
router.post('/finance-user-account', AdminRoutes, AdminFinanceUser)
router.get('/admin-dashboard', AdminDashboard)


router.post('/kyc/upload', UserRoutes, KycUpload)
router.post('/kyc/update', AdminRoutes, UpdateUserKyc)
router.post('/kyc/delete', AdminRoutes, DeleteKycDocument)

module.exports = router