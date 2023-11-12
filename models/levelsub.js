module.exports = (sequelize, DataTypes) => {
    const Levelsub = sequelize.define('levelsub', {
        level: {type: DataTypes.INTEGER, allowNull: false},
        sub: {type: DataTypes.INTEGER, allowNull: false},
        percent: {type: DataTypes.FLOAT, allowNull: false},
        min: {type: DataTypes.FLOAT, allowNull: true},
        max: {type: DataTypes.FLOAT, allowNull: true},
    })

    return Levelsub

}