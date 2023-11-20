const { ServerError } = require('../config/utils')
const Email = require('../models').emails
const Notify = require('../models').notifies
const MailSender = require('../config/mailconfig')
const otpGen = require('otp-generator')

exports.CreateNotify = async (req, res) => {
    try {
        const { message, tag } = req.body
        if (!message || !tag) return res.json({ status: 400, msg: `incomplete request found` })
        const findItem = await Notify.findOne({ where: { tag } })
        if (findItem) return res.json({ status: 404, msg: `You already have a notification with this position available` })
        const item = await Notify.findAll({})
        if (item.length <= 3) {
            await Notify.create({ message, tag })
            return res.json({ status: 200, msg: `Notification Created Successfully` })
        } else {
            return res.json({ status: 404, msg: `You cannot upload more than 3 notifications, try updating what you already have` })
        }
    } catch (error) {
        ServerError(res, error)
    }
}


exports.UpdateNotify = async (req, res) => {
    try {
        const { message, tag, id } = req.body
        const item = await Notify.findOne({ where: { id } })
        if (!item) return res.json({ status: 404, msg: `Notification does not exist` })
        item.message = message
        item.tag = tag
        await item.save()
        return res.json({ status: 200, msg: `Notification Updated Successfully` })
    } catch (error) {
        ServerError(res, error)
    }
}

exports.GetNotify = async (req, res) => {
    try {
        const item = await Notify.findAll({})
        return res.json({ status: 200, msg: item })
    } catch (error) {
        ServerError(res, error)
    }
}

exports.DeleteNotify = async (req, res) => {
    try {
        const item = await Notify.findByPk(req.body.id)
        if (!item) return res.json({ status: 404, msg: `Notification does not exists` })
        await item.destroy()

        return res.json({ status: 200, msg: `Notification deleted` })
    } catch (error) {
        ServerError(res, error)
    }
}

exports.SingleNotify = async (req, res) => {
    try {
        const item = await Notify.findByPk(req.params.id)
        if (!item) return res.json({ status: 404, msg: `Notification not found` })
        return res.json({ status: 200, msg: item })
    } catch (error) {
        ServerError(res, error)
    }
}


exports.ManageEmailAutomation = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.json({ status: 404, msg: `Provide a vallid email address` })
        const OTP = otpGen.generate(6, { specialChars: false, lowerCaseAlphabets: false })
        await Email.create({ email, code: OTP })
        // admin must verify he has access to the email first
        await MailSender({ code: OTP, template: 'verification', sendTo: email, subject: `Email Automation Verification` })
        return res.json({ status: 200, msg: `Your Email verification code has been sent to ${email.slice(0, 3)}********${email.slice(-10)}` })
    } catch (error) {
        ServerError(res, error)
    }
}

exports.ResendEmailAutomationCode = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.json({ status: 404, msg: `Provide a vallid email address` })
        const OTP = otpGen.generate(6, { specialChars: false, lowerCaseAlphabets: false })
        const item = await Email.findOne({ where: { email } })
        if (!item) return res.json({ status: 404, msg: `Email Address not found` })
        item.code = OTP
        await item.save()
        // admin must verify he has access to the email first
        await MailSender({ code: OTP, template: 'verification', sendTo: email, subject: `Resend: Email Automation Verification` })
        return res.json({ status: 200, msg: `Your Email verification code has been sent to ${email.slice(0, 3)}********${email.slice(-10)}` })
    } catch (error) {
        ServerError(res, error)
    }
}

exports.AcceptAutomationCode = async (req, res) => {
    try {
        const { code } = req.body
        const item = await Email.findOne({ where: { code } })
        if (!item) return res.json({ status: 404, msg: `Invalid verification code found` })
        item.verified = 'true'
        item.code = null
        await item.save()
    } catch (error) {
        ServerError(res, error)
    }
}


exports.ToggleEmailAutomation = async (req, res) => {
    try {
        const { tag, id } = req.body
        const item = await Email.findByPk(id)
        if (!item) return res.json({ status: 404, msg: `Email Address does not exists` })
        // check if any email is active, only one email can be active at a time
        item.active = tag
        await item.save()
        return res.json({ status: 200, msg: `Email Updated Successfully` })
    } catch (error) {
        ServerError(res, error)
    }
}