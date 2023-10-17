const { ServerError } = require('../config/utils')

const Admintransaction = require('../models').admintransactions
const User = require('../models').users
const Transaction = require('../models').transactions

exports.AllUserTransactions = async (req, res) => {
    try {
        const trans = await Transaction.findAll({
            where: {user: req.user},
            include: [{model: User, as: 'trans'}],
            order: [['createdAt', 'DESC']]
        })
        return res.json({status: 200, msg: trans})
    } catch (error) {
        ServerError(res, error)
    }
}

exports.AdminGetAllTransactions = async (req, res) => {
    try {
        const {limit} = req.query
        const totals = await Admintransaction.findAll({})
        const items = await Admintransaction.findAll({
            include: [{model: User, as: 'trans'}],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: 0
        })
        

        return res.json({status: 200, msg: items, total: totals.length})
    } catch (error) {
        ServerError(res, error)
    }
}

exports.AdminFiltersTransactions = async (req, res) => {
    try {
        const {status, limit, service, category, search} = req.body 
        const items = await Admintransaction.findAll({
            where: {status: status, service: service},
            limit: parseInt(limit)
        })

        return res.json({status: 200, msg: items})
    } catch(error) {
        ServerError(res, error)
    }
}
