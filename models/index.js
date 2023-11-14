const dbconfig = require('../config/dbconfig')

const {DataTypes, Sequelize} = require('sequelize')

const sequelize = new Sequelize(
    dbconfig.DB,
    dbconfig.USER,
    dbconfig.PASSWORD, {
        host: dbconfig.HOST,
        dialect: dbconfig.dialect,
        operatorsAliases: true,

        pool: {
            max: dbconfig.max,
            min: dbconfig.min,
            acquire: dbconfig.acquire,
            idle: dbconfig.idle
        }
    }
)

sequelize.authenticate()
.then(() => console.log('Server connected'))
.catch((error) => console.log(`Server Error ${error}`))

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize 
// reqister all models
db.users = require('./user')(sequelize, DataTypes)
db.admincontacts = require('./admincontact')(sequelize, DataTypes)
db.subscriptions = require('./subscription')(sequelize, DataTypes)
db.subscriptiondata = require('./subscriptiondata')(sequelize, DataTypes)
db.levels = require('./level')(sequelize, DataTypes)
db.automations = require('./automation')(sequelize, DataTypes)
db.networks = require('./network')(sequelize, DataTypes)
db.endpoints = require('./endpoint')(sequelize, DataTypes)
db.deposits = require('./deposit')(sequelize, DataTypes)
db.withdraws = require('./withdraw')(sequelize, DataTypes)
db.transactions = require('./transaction')(sequelize, DataTypes)
db.admintransactions = require('./admintransaction')(sequelize, DataTypes)
db.apiplans = require('./apiplan')(sequelize, DataTypes)
db.levelsubs = require('./levelsub')(sequelize, DataTypes)
db.levelpackages = require('./levelpackage')(sequelize, DataTypes)
db.airtimes = require('./airtime')(sequelize, DataTypes)
db.cables = require('./cable')(sequelize, DataTypes)
db.electricities = require('./electricity')(sequelize, DataTypes)
db.exams = require('./exam')(sequelize, DataTypes)
db.notifies = require('./notify')(sequelize, DataTypes)
db.kyclimits = require('./kyclimit')(sequelize, DataTypes)
db.kyctracks = require('./kyctrack')(sequelize, DataTypes)


db.sequelize.sync({force: false}).then(() => console.log(`re-sync done`))
// tag all relationships
// one to many relationships
db.users.hasMany(db.transactions, {foreignKey: 'user', as: 'user'})
db.subscriptions.hasMany(db.subscriptiondata, {foreignKey: 'network', as: 'sub'})
db.automations.hasMany(db.endpoints, {foreignKey: 'automation', as: 'autos'})
db.automations.hasMany(db.networks, {foreignKey: 'automation', as: 'networks'})
db.automations.hasMany(db.apiplans, {foreignKey: 'automation', as: 'plans'})
db.levels.hasMany(db.users, {foreignKey: 'level', as: 'level'})
db.automations.hasMany(db.airtimes, {foreignKey: 'automation', as: 'airs'})
db.automations.hasMany(db.cables, {foreignKey: 'automation', as: 'cabs'})
db.automations.hasMany(db.exams, {foreignKey: 'automation', as: 'exams'})
db.automations.hasMany(db.electricities, {foreignKey: 'automation', as: 'electricities'})
db.airtimes.hasMany(db.networks, {foreignKey: 'automation', as: 'airnetworks'})
db.airtimes.hasMany(db.apiplans, {foreignKey: 'automation', as: 'airplans'})
db.cables.hasMany(db.networks, {foreignKey: 'automation', as: 'cabnetworks'})
db.cables.hasMany(db.apiplans, {foreignKey: 'automation', as: 'cabplans'})
db.exams.hasMany(db.networks, {foreignKey: 'automation', as: 'exnetworks'})
db.exams.hasMany(db.apiplans, {foreignKey: 'automation', as: 'explans'})
db.electricities.hasMany(db.networks, {foreignKey: 'automation', as: 'elecnetworks'})
db.electricities.hasMany(db.apiplans, {foreignKey: 'automation', as: 'elecplans'})
db.levels.hasMany(db.levelpackages, {foreignKey: 'level', as: 'levelpack'})
db.levels.hasMany(db.levelsubs, {foreignKey: 'level', as: 'levelsub'})

// many to one relationships
db.subscriptiondata.belongsTo(db.subscriptions, {foreignKey: 'network', as: 'sub'});
db.endpoints.belongsTo(db.automations, {foreignKey: 'automation', as: 'autos'})
db.networks.belongsTo(db.automations, {foreignKey: 'automation', as: 'networks'})
db.networks.belongsTo(db.airtimes, {foreignKey: 'automation', as: 'airnetworks'})
db.networks.belongsTo(db.cables, {foreignKey: 'automation', as: 'cabnetworks'})
db.networks.belongsTo(db.exams, {foreignKey: 'automation', as: 'exnetworks'})
db.networks.belongsTo(db.electricities, {foreignKey: 'automation', as: 'elecnetworks'})
db.transactions.belongsTo(db.users, {foreignKey: 'user', as: 'trans'})
db.admintransactions.belongsTo(db.users, {foreignKey: 'user', as: 'trans'})
db.apiplans.belongsTo(db.automations, {foreignKey: 'automation', as: 'plans'})
db.apiplans.belongsTo(db.airtimes, {foreignKey: 'automation', as: 'airplans'})
db.apiplans.belongsTo(db.cables, {foreignKey: 'automation', as: 'cabplans'})
db.apiplans.belongsTo(db.exams, {foreignKey: 'automation', as: 'explans'})
db.apiplans.belongsTo(db.electricities, {foreignKey: 'automation', as: 'elecplans'})
db.users.belongsTo(db.levels, {foreignKey: 'level', as: 'levels'})
db.airtimes.belongsTo(db.automations, {foreignKey: 'automation', as: 'airs'})
db.cables.belongsTo(db.automations, {foreignKey: 'automation', as: 'cabs'})
db.exams.belongsTo(db.automations, {foreignKey: 'automation', as: 'exams'})
db.electricities.belongsTo(db.automations, {foreignKey: 'automation', as: 'electricities'})
db.levelpackages.belongsTo(db.levels, {foreignKey: 'level', as: 'levelpack'})
db.levelsubs.belongsTo(db.levels, {foreignKey: 'level', as: 'levelsub'})


module.exports = db
