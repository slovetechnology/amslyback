
module.exports = (sequelize, DataTypes) => {
    const Kyclimit = sequelize.define('kyclimit', {
        amounts: { type: DataTypes.FLOAT, DefaultValue: 1000, allowNull: false }, 
        
    })
    return Kyclimit
}
