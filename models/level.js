module.exports = (sequelize, DataTypes) => {
    const Level = sequelize.define('level', {
        title: { type: DataTypes.STRING, allowNull: false },
        leveltype: { type: DataTypes.STRING, allowNull: true, defaultValue: 'yes' }

    })
    return Level
}