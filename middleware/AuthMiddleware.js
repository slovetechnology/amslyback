const jwt = require('jsonwebtoken')

exports.AllRoutes = (req, res, next) => {
    try {
        const authHeaders = req.headers.token
        if(!authHeaders) return res.json({status: 400, msg: `Access Denied`})
        const token = authHeaders
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if(!decoded) return res.json({status: 400, msg: `Your session has expired`})
        req.user = decoded.id
        next()
    } catch (error) {
        return res.json({ status: 400, msg: `Error ${error}` })
    }
}

exports.UserRoutes = (req, res, next) => {
    try {
        const authHeaders = req.headers.token
        if(!authHeaders) return res.json({status: 400, msg: `Access Denied`})
        const token = authHeaders
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if(!decoded) return res.json({status: 400, msg: `Your session has expired`})

        if(decoded.role !== 'user') return res.json({status: 400, msg: `You Account is not authorized for this request`})
        req.user = decoded.id
        next()
    } catch (error) {
        return res.json({ status: 400, msg: `Error ${error}` })
    }
}

exports.AdminRoutes = (req, res, next) => {
    try {
        const authHeaders = req.headers.token
        if(!authHeaders) return res.json({status: 400, msg: `Access Denied`})
        const token = authHeaders
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if(!decoded) return res.json({status: 400, msg: `Your session has expired`})

        if(decoded.role !== 'admin') return res.json({status: 400, msg: `You Account is not authorized for this request`})
        req.user = decoded.id
        next()
    } catch (error) {
        return res.json({ status: 400, msg: `Error ${error}` })
    }
}