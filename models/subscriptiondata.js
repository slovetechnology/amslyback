module.exports = (sequelize, DataTypes) => {
    const Subscriptiondata = sequelize.define('subscriptiondata', {
        network: {type: DataTypes.INTEGER, allowNull: false},
        automation: {type: DataTypes.INTEGER, allowNull: true},
        altAutomation: {type: DataTypes.INTEGER, allowNull: true},
        title: {type: DataTypes.STRING, allowNull: true},
        price: {type: DataTypes.FLOAT, allowNull: true},
        deal: {type: DataTypes.STRING, allowNull: true},
        deal: {type: DataTypes.STRING, allowNull: true},
        altDeal: {type: DataTypes.STRING, allowNull: true},
        autoNetwork: {type: DataTypes.STRING, allowNull: true},
        altAutoNetwork: {type: DataTypes.STRING, allowNull: true},
        lock: {type: DataTypes.STRING, allowNull: true, defaultValue: 'no'},
        charges: {type: DataTypes.FLOAT, allowNull: true, defaultValue: 0},
    })
    return Subscriptiondata
}