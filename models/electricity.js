module.exports = (sequelize, DataTypes) => {
    const Electricity = sequelize.define('electricity', {
        automation: {type: DataTypes.INTEGER, allowNull: false},
        method: {type: DataTypes.STRING, allowNull: false},
        format: {type: DataTypes.STRING, allowNull: false},
        serviceName: {type: DataTypes.STRING, allowNull: true},
        meterName: {type: DataTypes.STRING, allowNull: true},
        serviceTypeName: {type: DataTypes.STRING, allowNull: true},
        amountName: {type: DataTypes.STRING, allowNull: true},
    })

    return Electricity
}