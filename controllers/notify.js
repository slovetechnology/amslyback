const { ServerError } = require('../config/utils')

const Notify = require('../models').notifies

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
        if(!item) return res.json({status: 404, msg: `Notification not found`})
        return res.json({status: 200, msg: item})
    } catch (error) {
        ServerError(res, error)
    }
}