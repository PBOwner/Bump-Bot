const { Sequelize, DataTypes } = require('sequelize');

const serversql = new Sequelize({
    dialect: 'sqlite',
    storage: 'server.sqlite',
    logging: false
});

const Server = serversql.define('Server', {
    key: {
        type: DataTypes.TEXT,
        unique: true,
        allowNull: false
    },
    prefix: {
        type: DataTypes.TEXT,
        defaultValue: "%"
    },
    description: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    color: {
        type: DataTypes.TEXT,
        defaultValue: "0"
    },
    time: {
        type: DataTypes.TEXT,
        defaultValue: "0"
    },
    channel: {
        type: DataTypes.TEXT,
        defaultValue: "0"
    },
    wlc: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    gb: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    partner: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    ban: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'server_table'
});

const syncDatabase = async () => {
    try {
        await serversql.sync();
        console.log(' >  Server Cache');
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

module.exports = { Server, syncDatabase }
