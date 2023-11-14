module.exports = (sequelize, DataTypes) => {
    const Emailautomation = sequelize.define('emailautomation', {
        email: {type: DataTypes.STRING},
        active: {type: DataTypes.STRING, defaultValue: 'false'},
        code: {type: DataTypes.STRING, allowNull: true},
        verified: {type: DataTypes.STRING, defaultValue: 'false'},
    })
    return Emailautomation
}
