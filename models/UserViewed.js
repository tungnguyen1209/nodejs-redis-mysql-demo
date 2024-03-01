const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    return sequelize.define('sb_user_viewed_tmp', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        imei: {
            type: DataTypes.STRING,
            allowNull: false
        },
        target: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ip: {
            type: DataTypes.STRING,
            allowNull: false
        },
        user_agent: {
            type: DataTypes.STRING,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: 'sb_user_viewed_tmp'
    });
};
