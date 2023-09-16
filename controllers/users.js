
const User = require('../models').users
const Admincontact = require('../models').admincontacts
const Transaction = require('../models').transactions
const Admintransaction = require('../models').admintransactions
const Level = require('../models').levels
const Deposit = require('../models').deposits
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const otpGenerator = require('otp-generator')
const { ServerError } = require('../config/utils')

const validateFormData = (firstname, lastname, phone, email, username, password, confirm_password) => {
    if (!firstname) return res.json({ status: 400, msg: `firstname is required` })
    if (!lastname) return res.json({ status: 400, msg: `lastname is required` })
    if (!phone) return res.json({ status: 400, msg: `phone number is required` })
    if (!email) return res.json({ status: 400, msg: `email address is required` })
    if (!username) return res.json({ status: 400, msg: `username is required` })
    if (!password) return res.json({ status: 400, msg: `password is required` })
    if (!confirm_password) return res.json({ status: 400, msg: ` password confirmation is required` })
    if (confirm_password !== password) return res.json({ status: 400, msg: `password(s) mismatch detected` })
    return true
}

exports.UserSignup = async (req, res) => {
    try {
        const { firstname, lastname, upline, phone, email, username, password, confirm_password } = req.body
        await validateFormData(firstname, lastname, phone, email, username, password, confirm_password)
        // check if email already exists
        const checkEmail = await User.findOne({ where: { email: email } })
        if (checkEmail) return res.json({ status: 400, msg: `Email Address already exists` })
        // check if username already exists
        const checkUsername = await User.findOne({ where: { username: username } })
        if (checkUsername) return res.json({ status: 400, msg: `Username already exists` })
        // check if phone number already exists
        const checkPhone = await User.findOne({ where: { phone: phone } })
        if (checkPhone) return res.json({ status: 400, msg: `Phone number already exists` })
        // generate otp 
        const otp = otpGenerator.generate(5, {
            digits: true,
            upperCase: true,
            lowerCase: false,
            specialChars: false
        })

        const options = {digits: true, upperCase: true, specialChars: false, lowerCase: false}
        const getsalt = bcrypt.genSaltSync(10)
        const newpswd = bcrypt.hashSync(password, getsalt)
        const refData = `REF_${firstname.slice(-3)}${otpGenerator.generate(8, {...options})}${lastname.slice(-3)}`
        const newuser = { firstname, upline: upline, refid: refData, role: `user`, lastname, email, phone, username, resetcode: otp, pass: password, password: newpswd, verified: 'false', status: 'offline' }
        const userData = await User.create(newuser)

        // now check if there is no level then create on and tag the user to it, else just tag user to the level
        const findLevel = await Level.findAndCountAll({})
        if(findLevel.count === 0) {
            const levelFile = {title: 'Level 1'}
            const lev = await Level.create(levelFile)

            userData.level = lev.id 
            await userData.save()
        }
        return res.json({ status: 200, msg: email })

    } catch (error) {
      ServerError(res, error)
    }
}

exports.VerifySignupWithOtp = async (req, res) => {
    try {
        const { code } = req.body
        const user = await User.findOne({ where: { resetcode: code } })
        if (!user) return res.json({ status: 400, msg: `Invalid verification Code detected` })
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '0.5d' })

        user.verified = 'true'
        await user.save()
        return res.json({ status: 200, msg: 'Account Successfully Verified!', token })
    } catch (error) {
      ServerError(res, error)
    }
}

exports.ResetVerificationOTP = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ where: { email: email } })
        if (!user) return res.json({ status: 404, msg: `User not found` })

        const otp = otpGenerator.generate(5, {
            digits: true,
            upperCase: true,
            lowerCase: false,
            specialChars: false
        })
        user.resetcode = otp
        await user.save()
        return res.json({ status: 200, msg: `Verification code sent!.` })
    } catch (error) {
      ServerError(res, error)
    }
}

exports.UserLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ where: { email: email } })
        if (!user) return res.json({ status: 400, msg: `User not found` })
        const valid = bcrypt.compareSync(password, user.password)
        if (!valid) return res.json({ status: 400, msg: `Invalid password detected` })

        // now check if there is no level then create on and tag the user to it, else just tag user to the level
        const findLevel = await Level.findAndCountAll({})
        if(findLevel.count === 0) {
            const levelFile = {title: 'Level 1'}
            const lev = await Level.create(levelFile)

            user.level = lev.id 
            await user.save()
        }

        if (user.role === 'admin') return res.json({ status: 201 })

        // check if user account is blocked 
        if (user.block === 'yes') return res.json({ status: 403, msg: `Your Account has been temporarily suspended, contact support@datacenter.com for further assistance` })
        user.status = 'active'
        await user.save()

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '0.5d' })
        return res.json({ status: 200, msg: `Welcome back ${user.firstname}, glad to host you again`, token: token })
    } catch (error) {
        ServerError(res, error)
    }
}

exports.FetchuserAccount = async (req, res) => {
    try {
        const user = await User.findOne({ 
            where: { id: req.user },
            include: [{model: Level, as: 'levels'}]
         })
        if (!user) return res.json({ status: 400, msg: `User not found` })
        const options = {digits: true, upperCase: true, specialChars: false, lowerCase: false}
        const gens = `API_${otpGenerator.generate(50, {...options})}`
        const refData = `REF_${user.firstname.slice(-3)}${otpGenerator.generate(8, {...options})}${user.lastname.slice(-3)}`
        if(user.refid === null) {
            user.apitoken = gens.toUpperCase()
            user.refid = refData.toUpperCase()
            await user.save()
        }

        const levels = await Level.findAll({})
       return res.json({ status: 200, msg: user, levels });
    } catch (error) {
      ServerError(res, error)
    }
}

exports.UserLogout = async (req, res) => {
    try {
        const user = await User.findOne({ where: { id: req.user } })
        user.status = 'offline'
        await user.save()
        return res.json({ status: 200, msg: `User logged out` })
    } catch (error) {
      ServerError(res, error)
    }
}

exports.FetchMyDownliners = async (req, res) => {
    try {
        const findMe = await User.findOne({where: {id: req.user}})
        const users = await User.findAll({
            where: {upline: findMe.refid},
            order: [['createdAt', 'DESC']]
        })
        const mapped = []
        users.map((item) => {
            const selectFields = {
                firstname: item.firstname,
                lastname: item.lastname,
                status: item.status,
                createdAt: item.createdAt
            }

            return mapped.push(selectFields)
        })

        return res.json({status: 200, msg: mapped})
    } catch (error) {
        return res.json({status: 400, msg: `Error ${error}`})
    }
}

exports.SetupAccessPin = async (req, res) => {
    try {
        const { pin } = req.body
        const user = await User.findOne({ where: { id: req.user } })
        if (!user) return res.json({ status: 400, msg: `User not found` })
        user.pin = pin
        await user.save()
        return res.json({ status: 200, msg: `Access Pin set successfully`, user })
    } catch (error) {
      ServerError(res, error)
    }
}

exports.ConfirmAdminLoginAccess = async (req, res) => {
    try {
        const { pin, email } = req.body
        const findPin = await User.findOne({ where: { pin: pin } })
        if (!findPin) return res.json({ status: 400, msg: `Invalid pin` })
        const findEmail = await User.findOne({ where: { email: email } })
        if (!findEmail) return res.json({ status: 400, msg: `Email Address does not exist` })
        // check if the account holding the email is same as the account holding the pin

        if (findPin.pin !== findEmail.pin) return res.json({ status: 400, msg: `user account does not exist` })
        //go ahead to login user

        findEmail.status = 'active'
        await findEmail.save()
        const token = jwt.sign({ id: findEmail.id, role: findEmail.role }, process.env.JWT_SECRET, { expiresIn: '0.5d' })
        return res.json({ status: 200, msg: `Welcome back ${findEmail.firstname}, glad to host you again`, token: token })
    } catch (error) {
      ServerError(res, error)
    }
}

// admin gets all users mobile 
exports.AdminFetchAllUsersMobile = async (req, res) => {
    try {
        const users = await User.findAll({})
        const phones = []
        const filtered = users.filter((item) => item.id !== req.user)
        filtered.map((item) => {
            phones.push(item.phone)
        })
        return res.json({ status: 200, msg: phones })
    } catch (error) {
      ServerError(res, error)
    }
}

// admin gets all users email 
exports.AdminFetchAllUsersEmails = async (req, res) => {
    try {
        const users = await User.findAll({})
        const emails = []
        const filtered = users.filter((item) => item.id !== req.user)
        filtered.map((item) => {
            emails.push(item.email)
        })
        return res.json({ status: 200, msg: emails })
    } catch (error) {
      ServerError(res, error)
    }
}
// admin get all users
exports.AdminFetchAllUsers = async (req, res) => { 
    try {
        const users = await User.findAll({})
        const levels = await Level.findAll({})
        const mapped = []
        await users.map(async (ele) => {
            const lev = levels.find((item) => item.id === ele.level)
            const newData = {
                ...ele.dataValues,
                level: lev
            }
            return mapped.push(newData)
        })
        return res.json({ status: 200, msg: mapped })
    } catch (error) {
      ServerError(res, error)
    }
}

// admin block user account 
exports.AdminBlockUserAccount = async (req, res) => {
    try {
        const { email, status } = req.body
        const user = await User.findOne({ where: { email: email } })
        if (!user) return res.json({ status: 400, msg: `User not found` })
        // admin cannot block his own account
        if (user.id === req.user) return res.json({ status: 400, msg: `You cannot block your admin account` })

        user.block = status
        await user.save()
        return res.json({ status: 200, msg: `${user.firstname}'s account has been successfully ${status === 'no' ? 'Unblocked' : 'Blocked'}` })
    } catch (error) {
      ServerError(res, error)
    }
}

exports.AdminGetContactInfo = async (req, res) => {
    try {
        const contact = await Admincontact.findOne({where: {user_id: req.user}})
        return res.json({status: 200, msg: contact})
    } catch (error) {
        return res.json({ status: 400, msg: `Error ${error}`})
    }
}

// admin adds or updates contact infos
exports.AdminAddContactInfo = async (req, res) => {
    try {
        const { mobile, address, email, facebook, whatsapp, twitter, instagram, linkedin } = req.body
        if (!mobile || !address || !email) return res.json({ status: 400, msg: `Unable tp complete your request. kindly fill all fields properly` })

        const info = await Admincontact.findOne({ where: { user_id: req.user } })

        // if info already exists 
        if (info) {
            info.mobile = mobile
            info.address = address
            info.email = email
            info.facebook = facebook
            info.whatsapp = whatsapp
            info.twitter = twitter
            info.instagram = instagram
            info.linkedin = linkedin
            await info.save()
            return res.json({status: 200, msg: `Contact information successfully updated`})
        }

        // if info does not exist
        if (!info) {
            const newinfo = { user_id: req.user, mobile, address, email, facebook, whatsapp, twitter, instagram, linkedin }
            await Admincontact.create(newinfo)
            return res.json({status: 200, msg: `Contact information successfully created`})
        }
    } catch (error) {
      ServerError(res, error)
    }
}

exports.AdminUpdateUserpassword = async (req, res) => {
    try {
        const {email, password, confirm_password} = req.body 
        if(!email || !password || !confirm_password) return res.json({status: 400, msg: `make sure all fields are properly filled`})
        if(password!== confirm_password) return res.json({status: 400, msg: `Passwords do not match`})
        const user = await User.findOne({where: {email: email}})
        if(!user) return res.json({status: 400, msg: `User not found`})
        if(user.id === req.user) return res.json({status: 400, msg: `You can only update a user account`})
        const getSalt = bcrypt.genSaltSync(10)
        const newpswd = bcrypt.hashSync(password, getSalt)
        user.password = newpswd
        user.pass = password
        await user.save()
        return res.json({status: 200, msg: `Password successfully updated`})
    } catch (error) {
        return res.json({status: 400, msg: `Error ${error}`})
    }
} 

exports.AdminUpdateUserpin = async (req, res) => {
    try {
        const {email, pin, confirm_pin} = req.body 
        if(!email || !pin || !confirm_pin) return res.json({status: 400, msg: `make sure all fields are properly filled`})
        if(pin!== confirm_pin) return res.json({status: 400, msg: `pins do not match`})
        const user = await User.findOne({where: {email: email}})
        if(!user) return res.json({status: 400, msg: `User not found`})
        if(user.id === req.user) return res.json({status: 400, msg: `You can only update a user account`})
        user.datapin = pin
        await user.save()
        return res.json({status: 200, msg: `pin successfully updated`})
    } catch (error) {
        return res.json({status: 400, msg: `Error ${error}`})
    }
} 

exports.CreatDataPin = async (req, res) => {
    try {
        const {pin, confirm_pin} = req.body 

        if(!pin) return res.json({status: 400, msg: `Invalid pin`})
        if(!confirm_pin) return res.json({status: 400, msg: `Invalid confirmation pin`})
        if(confirm_pin !== pin) return res.json({status: 400, msg: `Validation Error: pin(s) not matched`})
        if(pin.length < 4) return res.json({status: 400, msg: `Pin must be at least 4 characters long`})
        if(confirm_pin.length < 4) return res.json({status: 400, msg: `Confirm pin must be at least 4 characters long`})
        const user = await User.findByPk(req.user)

        user.datapin = pin 
        await user.save()
        return res.json({status: 200, user: user, msg: `Transaction Pin successfully created`})
    } catch (error) {
      ServerError(res, error)
    }
}

exports.AdminFinanceUser = async (req, res) => {
    try {
        const {email, amount, note} = req.body 
        if(!email || !amount || !note) return res.json({status: 400, msg: `Error completing process, please provide all required fields!`})
        const user = await User.findOne({where: {email: email}})
        if(!user) return res.json({status: 400, msg: `User Not Found`})
        // check is there is a minus on the amount 
        const date = new Date()
        const txid = `TXID_${otpGenerator.generate(5, {digits: true, specialChars: false, lowerCaseAlphabets: true, upperCaseAlphabets: true})}${date.getTime()}`
        const title = 'wallet funding'
        if(amount.startsWith('-')) {
            // check if user balance is initially 0
            // if(user.balance === 0) return res.json({status: 400, msg: `Cannot deduct from user balance, fund this user first in order to perform deduction of funds`})
            user.prevbalance = user.balance
            user.balance = eval(`${user.balance}${amount}`)
        }else {
            user.prevbalance = user.balance 
            user.balance = eval(`${user.balance}+${amount}`)
        }
        await user.save()
        const newdept = {user: user.id, note, amount, status: 'success', txid, prevbal: user.prevbalance, currbal: user.balance, title}
        const depo = await Deposit.create(newdept)

        const newtrans = {user: user.id, note, amount, tag: depo.id, status: 'success', txid, prevbal: user.prevbalance, currbal: user.balance, title}
        await Transaction.create(newtrans)
        await Admintransaction.create(newtrans)

        return res.json({status: 200, msg: `User Account Updated successfully`, user})
    } catch (error) {
        return res.json({status: 400, msg: `Error ${error}`})
    }
}