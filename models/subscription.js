module.exports = (sequelize, DataTypes) => {
    const Subscription = sequelize.define('subscription', {
        tag: {type: DataTypes.STRING, allowNull: true},
        network: {type: DataTypes.STRING, allowNull: false},
        category: {type: DataTypes.STRING, allowNull: false},
        percent: {type: DataTypes.FLOAT, allowNull: true, defaultValue: 100},
        min: {type: DataTypes.FLOAT, allowNull: true, allowNull: true},
        max: {type: DataTypes.FLOAT, allowNull: true, allowNull: true},
        locked: {type: DataTypes.STRING, allowNull: false, defaultValue: 'no'},
    })
    return Subscription
}