module.exports = (sequelize, DataTypes) => {
    const Admintransaction = sequelize.define('admintransaction', {
        user: {type: DataTypes.INTEGER},
        tag: {type: DataTypes.INTEGER}, //checks if its deposit or withdrawal
        title: {type: DataTypes.STRING},
        autos: {type: DataTypes.STRING, allowNull: true},
        amount: {type: DataTypes.FLOAT},
        note: {type: DataTypes.STRING(1000)},
        status: {type: DataTypes.STRING, allowNull: true},
        txid: {type: DataTypes.STRING, allowNull: true},
        prevbal: {type: DataTypes.FLOAT, allowNull: true},
        currbal: {type: DataTypes.FLOAT, allowNull: true},
    })

    return Admintransaction
}
