module.exports = (sequelize, DataTypes) => {
    const Cable = sequelize.define('cable', {
        automation: {type: DataTypes.INTEGER, allowNull: false},
        method: {type: DataTypes.STRING, allowNull: false},
        format: {type: DataTypes.STRING, allowNull: false},
        serviceName: {type: DataTypes.STRING, allowNull: true},
        decoderName: {type: DataTypes.STRING, allowNull: true},
        planName: {type: DataTypes.STRING, allowNull: true},
    })

    return Cable
}