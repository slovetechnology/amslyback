const { Op } = require('sequelize')
const { ServerError } = require('../config/utils')

const Admintransaction = require('../models').admintransactions
const User = require('../models').users
const Transaction = require('../models').transactions
const Subscription = require('../models').subscriptions


const exclusions = ['password', 'apitoken', 'datapin', 'pin', 'pass', 'refid', 'kyc', 'idfront', 'idback', 'prevbalance', 'balance', 'kycnote', 'block', 'resetcode', 'role', 'upline', 'verified', 'createdAt', 'note', 'level', 'dob', 'address', 'updatedAt', 'maritalStatus', 'gender', 'image', 'status', 'username']
exports.AllUserTransactions = async (req, res) => {
    try {
        const { limit } = req.query
        const trans = await Transaction.findAll({
            where: { user: req.user },
            include: [{ model: User, as: 'trans' }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit || 30),
            offset: 0
        })
        return res.json({ status: 200, msg: trans })
    } catch (error) {
        ServerError(res, error)
    }
}

exports.AdminGetAllTransactions = async (req, res) => {
    try {
        const { limit } = req.query
        const totals = await Admintransaction.findAll({})
        const items = await Admintransaction.findAll({
            include: [{ model: User, as: 'trans', attributes: { exclude: exclusions } }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: 0
        })


        return res.json({ status: 200, msg: items, total: totals.length })
    } catch (error) {
        ServerError(res, error)
    }
}

exports.UserFilterTransactions = async (req, res) => {
    try {
        const { status, limit, category, service, search } = req.body
        let filterByStatus = {}, filterByCategory = {}, filterByService = {}, filterByEmail = {}
        if (status !== 'all') { filterByStatus = { status } } else { filterByStatus = {} }
        if (category !== 'all') { filterByCategory = { title: { [Op.like]: `%${category}%` } } } else { filterByCategory = {} }
        if (service !== 'all') { filterByService = { note: { [Op.like]: `%${service}%` } } } else { filterByService = {} }
        if (search !== 'all') { filterByEmail = { note: { [Op.like]: `%${search}%` } } } else { filterByEmail = {} }
        const items = await Admintransaction.findAll({
            where: {
                ...filterByCategory,
                ...filterByStatus,
                ...filterByService,
                ...filterByEmail,
            },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        })


        return res.json({ status: 200, msg: items, total: items.length })
    } catch (error) {
        ServerError(res, error)
    }
}

exports.AdminFiltersTransactions = async (req, res) => {
    try {
        const { status, limit, service, category, search } = req.body
        let filterByStatus = {}, filterByCategory = {}, filterByService = {}, filterByEmail = []
        if (status !== 'all') { filterByStatus = { status } } else { filterByStatus = {} }
        if (category !== 'all') { filterByCategory = { title: { [Op.like]: `%${category}%` } } } else { filterByCategory = {} }
        if (service !== 'all') { filterByService = { note: { [Op.like]: `%${service}%` } } } else { filterByService = {} }
        const items = await Admintransaction.findAll({
            where: {
                ...filterByCategory,
                ...filterByStatus,
                ...filterByService,
                ...filterByEmail,
            },
            include: [{ model: User, as: 'trans', attributes: { exclude: exclusions } }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        })
        if(search) {
            items.map(ele => {
                if(ele.trans.email.includes(search) || ele.trans.phone.includes(search) || ele.txid.includes(search)) {
                    filterByEmail.push(ele)
                }
            })
            return res.json({ status: 200, msg: filterByEmail, total: filterByEmail.length })
        }

        return res.json({ status: 200, msg: items, total: items.length })
    } catch (error) {
        ServerError(res, error)
    }
}


exports.AdminGetSalesAnalysis = async (req, res) => {
    try {
        const subs = await Subscription.findAll({}), subnets = [], trans = await Admintransaction.findAll({order: [['createdAt', 'DESC']]})
        subs.map(ele => {
            subnets.push(ele.network)
        })
        return res.json({status: 200, msg: trans})
    } catch (err) {
        ServerError(res, err)
    }
}