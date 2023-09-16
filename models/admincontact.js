module.exports = (sequelize, DataTypes) => {
    const Admincontact = sequelize.define('admincontact', {
        user_id: {type: DataTypes.INTEGER},
        mobile: {type: DataTypes.STRING},
        address: {type: DataTypes.STRING},
        email: {type: DataTypes.STRING},
        facebook: {type: DataTypes.STRING},
        whatsapp: {type: DataTypes.STRING},
        twitter: {type: DataTypes.STRING},
        instagram: {type: DataTypes.STRING},
        linkedin: {type: DataTypes.STRING},
    })

    return Admincontact
}