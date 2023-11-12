
module.exports = (sequelize, DataTypes) => {
    const Kyctrack = sequelize.define('kyctrack', {
        user: {type: DataTypes.INTEGER},
        amount: {type: DataTypes.FLOAT},
        date: {type: DataTypes.STRING}, //DD-MM-YYYYY
    })

    return Kyctrack
}