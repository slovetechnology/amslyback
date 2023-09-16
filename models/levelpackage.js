module.exports = (sequelize, DataTypes) => {
    const Levelpackage = sequelize.define('levelpackage', {
        level: {type: DataTypes.INTEGER, allowNull: false},
        pack: {type: DataTypes.INTEGER, allowNull: false},
        pricing: {type: DataTypes.STRING, allowNull: false},
    })

    return Levelpackage
}
