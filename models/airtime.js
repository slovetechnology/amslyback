module.exports = (sequelize, DataTypes) => {
    const Airtime = sequelize.define('airtime', {
        automation: {type: DataTypes.INTEGER, allowNull: false},
        method: {type: DataTypes.STRING, allowNull: false},
        format: {type: DataTypes.STRING, allowNull: false},
        mobileName: {type: DataTypes.STRING, allowNull: true},
        networkName: {type: DataTypes.STRING, allowNull: true},
        amountName: {type: DataTypes.STRING, allowNull: true},
        refName: {type: DataTypes.STRING, allowNull: true},
    })

    return Airtime
}