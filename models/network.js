module.exports = (sequelize, DataTypes) => {
    const Network = sequelize.define('network', {
        automation: {type: DataTypes.INTEGER, allowNull: false},
        title: {type: DataTypes.STRING, allowNull: false},
        tag: {type: DataTypes.STRING, allowNull: false},
        nets: {type: DataTypes.STRING, allowNull: false, defaultValue: 'data'},
    })
    return Network
}