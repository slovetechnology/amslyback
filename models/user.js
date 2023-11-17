module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('user', {
        firstname: { type: DataTypes.STRING },
        lastname: { type: DataTypes.STRING },
        username: { type: DataTypes.STRING },
        email: { type: DataTypes.STRING },
        role: { type: DataTypes.STRING },
        datapin: { type: DataTypes.STRING },
        level: { type: DataTypes.INTEGER, allowNull: true },
        pin: { type: DataTypes.STRING, allowNull: true },
        resetcode: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING },
        balance: { type: DataTypes.STRING, allowNull: true, defaultValue: 0 },
        prevbalance: { type: DataTypes.STRING, allowNull: true, defaultValue: 0 },
        block: { type: DataTypes.STRING, defaultValue: 'no' },
        dob: { type: DataTypes.STRING },
        image: { type: DataTypes.STRING, allowNull: true },
        address: { type: DataTypes.STRING, allowNull: true },
        refid: { type: DataTypes.STRING, allowNull: true },
        upline: { type: DataTypes.STRING, allowNull: true },
        apitoken: { type: DataTypes.STRING(1000), allowNull: true },
        phone: { type: DataTypes.STRING },
        gender: { type: DataTypes.STRING, allowNull: true },
        idfront: { type: DataTypes.STRING, allowNull: true },
        idback: { type: DataTypes.STRING, allowNull: true },
        kycnote: { type: DataTypes.STRING, allowNull: true },
        note: { type: DataTypes.STRING, allowNull: true },
        maritalStatus: { type: DataTypes.STRING, allowNull: true },
        kyc: { type: DataTypes.STRING, allowNull: true }, //shows if it nin or voter's card or driver's that was submitted
        verified: { type: DataTypes.STRING },
        pass: { type: DataTypes.STRING },
        password: { type: DataTypes.STRING },
        bonus: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0},
    })

    return User
}