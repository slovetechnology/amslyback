module.exports = (sequelize, DataTypes) => {
    const Automation = sequelize.define('automation', {
        title: {type: DataTypes.STRING, allowNull: false},
        apiurl: {type: DataTypes.STRING, allowNull: false},
        token: {type: DataTypes.STRING, allowNull: false},
        tokenName: {type: DataTypes.STRING, allowNull: false},
        method: {type: DataTypes.STRING, allowNull: false},
        format: {type: DataTypes.STRING, allowNull: false},
        refid: {type: DataTypes.STRING, allowNull: true},
        callback: {type: DataTypes.STRING, allowNull: true},
        planName: {type: DataTypes.STRING, allowNull: true},
        mobileName: {type: DataTypes.STRING, allowNull: true},
        portedNumber: {type: DataTypes.STRING, allowNull: true},
        portedName: {type: DataTypes.STRING, allowNull: true},
        refName: {type: DataTypes.STRING, allowNull: true},
        networkName: {type: DataTypes.STRING, allowNull: true},
        callbackName: {type: DataTypes.STRING, allowNull: true},
        auths: {type: DataTypes.STRING, allowNull: true, defaultValue: 'no'},
    })
    return Automation
}