module.exports = (sequelize, DataTypes) => {
    const Endpont = sequelize.define('endpoint', {
        automation: {type: DataTypes.INTEGER, allowNull: false},
        category: {type: DataTypes.STRING, allowNull: true},
        title: {type: DataTypes.STRING, allowNull: false},
    })
    return Endpont
}