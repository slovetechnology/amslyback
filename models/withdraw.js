module.exports = (sequelize, DataTypes) => {
    const Withdraw = sequelize.define('withdraw', {
        user: {type: DataTypes.INTEGER},
        amount: {type: DataTypes.FLOAT},
        title: {type: DataTypes.STRING},
        note: {type: DataTypes.STRING(1000)},
        status: {type: DataTypes.STRING, allowNull: true},
        service: {type: DataTypes.INTEGER, allowNull: true},
        txid: {type: DataTypes.STRING, allowNull: true},
        autos: {type: DataTypes.STRING, allowNull: true},
        prevbal: {type: DataTypes.FLOAT, allowNull: true},
        currbal: {type: DataTypes.FLOAT, allowNull: true},
    })

    return Withdraw
}