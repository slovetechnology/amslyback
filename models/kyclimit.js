
module.exports = (sequelize, DataTypes) => {
    const Kyclimit = sequelize.define('kyclimit', {
        amount: { type: DataTypes.FLOAT, defaultValue: 30, allowNull: true }
    })
    return Kyclimit
}
