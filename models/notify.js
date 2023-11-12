module.exports = (sequelize, DataTypes) => {
    const Notify = sequelize.define('notify', {
        message: {type: DataTypes.STRING},
        tag: {type: DataTypes.STRING},
    })
    return Notify
}