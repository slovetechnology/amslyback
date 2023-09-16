


exports.ServerError = (res, error) => {
    return res.json({status: 500, msg: `Something went wrong`, stack: `${error}`})
}