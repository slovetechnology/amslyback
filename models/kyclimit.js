<<<<<<< HEAD

module.exports = (sequelize, DataTypes) => {
    const Kyclimit = sequelize.define('kyclimit', {
        amount: { type: DataTypes.FLOAT, defaultValue: 30, allowNull: true }
    })
    return Kyclimit
}
=======
module.exports = (sequelize, DataTypes) => {
    const Kyclimit = sequelize.define('kyclimit', {
        amounts: { type: DataTypes.FLOAT, DefaultValue: 1000, allowNull: false }, 
        
    })
    return Kyclimit
}
>>>>>>> c9d144a9e557136fd6f84fb019a75427e1583e70
