const { Sequelize, Op } = require('sequelize');

const sequelize = new Sequelize(
    `${process.env.MYSQL_DATABASE}`,
    `${process.env.MYSQL_USER}`,
    `${process.env.MYSQL_PASSWORD}`,
    {
        host: 'db',
        dialect: 'mysql',
        logging: false
    }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Op;

// Import models
db.UserViewed = require('./UserViewed')(sequelize, Sequelize);

console.log(db.UserViewed);

module.exports = db;