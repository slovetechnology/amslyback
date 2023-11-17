
module.exports = (sequelize, DataTypes) => {
    const Reftrack = sequelize.define('reftrack', {
        upline: { type: DataTypes.STRING, allowNull: true },
        downline: { type: DataTypes.STRING, allowNull: true },
        amount: { type: DataTypes.FLOAT, defaultValue: 1000, allowNull: false },
        status: { type: DataTypes.STRING, DefaultValue: 'unpaid' },
    })
    return Reftrack
}