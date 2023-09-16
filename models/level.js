module.exports = (sequelize, DataTypes) => {
    const Level = sequelize.define('level', {
        title: {type: DataTypes.STRING, allowNull: false},
    })
    return Level
}