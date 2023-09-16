module.exports = (sequelize, DataTypes) => {
    const Exam = sequelize.define('exam', {
        automation: {type: DataTypes.INTEGER, allowNull: false},
        method: {type: DataTypes.STRING, allowNull: false},
        format: {type: DataTypes.STRING, allowNull: false},
        serviceName: {type: DataTypes.STRING, allowNull: true},
        variationName: {type: DataTypes.STRING, allowNull: true},
        mobileName: {type: DataTypes.STRING, allowNull: true},
    })

    return Exam
}
