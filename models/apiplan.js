module.exports = (sequelize, DataTypes) => {
    const Apiplan = sequelize.define('apiplan', {
        automation: {type: DataTypes.INTEGER, allowNull: false},
        pack: {type: DataTypes.INTEGER, allowNull: false},
        title: {type: DataTypes.STRING},
        plan: {type: DataTypes.STRING},
    })

    return Apiplan
}

