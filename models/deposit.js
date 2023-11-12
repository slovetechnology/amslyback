module.exports = (sequelize, DataTypes) => {
    const Deposit = sequelize.define('deposit', {
        user: {type: DataTypes.INTEGER},
        amount: {type: DataTypes.FLOAT},
        title: {type: DataTypes.STRING},
        autos: {type: DataTypes.STRING, allowNull: true},
        note: {type: DataTypes.STRING(1000)},
        status: {type: DataTypes.STRING, allowNull: true},
        service: {type: DataTypes.INTEGER, allowNull: true},
        txid: {type: DataTypes.STRING, allowNull: true},
        prevbal: {type: DataTypes.FLOAT, allowNull: true},
        currbal: {type: DataTypes.FLOAT, allowNull: true},
    })

    return Deposit
}