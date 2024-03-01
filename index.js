const express = require('express');
const redis = require('redis');
require('dotenv').config();
const db = require('./models/db');
const userViewed = db.UserViewed;

const app = express();
console.log(process.env.REDIS_HOST);
const client = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

(async () => {
    client.on('error', err => console.log('Redis Client Error', err));
    await client.connect()
})();

app.use(cors(corsOptions));

db.sequelize.sync()
    .then(() => {
        console.log("Synced db.");
    })
    .catch((err) => {
        console.log("Failed to sync db: " + err.message);
    });

// Route to fetch user by imei with caching
app.get('/user/info', async (req, res) => {
    const imei = req.params.imei;
    if (!imei) {
        res.json({statusCode: 400, message: 'Imei is required field!'})
    }

    const key = 'user_info_by_imei:' + imei;
    console.log(req.params.imei);
    const userByImei = await client.get(key);
    if (userByImei) {
        // Data found in cache, return it
        res.json({source: 'cache', data: JSON.parse(userByImei)});
    } else {
        const data = await userViewed.findAll({
            where: {
                imei: imei
            },
            limit: 1,
            order: [
                ['created_at', 'DESC']
            ],
            attributes: ['ip', 'user_agent']
        });

        console.log(data);
        // Store data in cache for next request
        if (data) {
            await client.set(key, JSON.stringify(data));
        }

        res.json({source: 'database', data});
    }
});

app.get('/users', async (req, res) => {
    const productId = req.params.product_id;
    let from = req.params.from;
    let to = req.params.to;
    if (!productId) {
        res.json({statusCode: 400, message: 'Product Id is required field!'})
    }

    if (!from) {
        from = Date.now().toString();
    }

    if (!to) {
        to = Date.now().toString();
    }

    const key = 'users_by_product_id:' + productId + ':' + from + ':' + to;
    const usersByProductId = await client.get(key);
    if (usersByProductId) {
        // Data found in cache, return it
        res.json({source: 'cache', data: JSON.parse(usersByProductId)});
    } else {
        const data = await userViewed.findAll({
            where: {
                target: productId,
                created_at: {
                    [db.Op.gte]: from,
                    [db.Op.lte]: to
                }
            },
            order: [
                ['created_at', 'DESC']
            ],
            attributes: ['ip', 'user_agent']
        });

        console.log(data);
        // Store data in cache for next request
        if (data) {
            await client.set(key, JSON.stringify(data));
        }

        res.json({source: 'database', data});
    }
});

app.get('/user/history', async (req, res) => {
    const imei = req.params.imei;
    let from = req.params.from;
    let to = req.params.to;
    if (!imei) {
        res.json({statusCode: 400, message: 'Imei is required field!'})
    }

    if (!from) {
        from = Date.now().toString();
    }

    if (!to) {
        to = Date.now().toString();
    }

    const key = 'user_history_by_imei:' + imei + ':' + from + ':' + to;
    const userHistory = await client.get(key);
    if (userHistory) {
        // Data found in cache, return it
        res.json({source: 'cache', data: JSON.parse(userHistory)});
    } else {
        const data = await userViewed.findAll({
            where: {
                imei: imei,
                created_at: {
                    [db.Op.gte]: from,
                    [db.Op.lte]: to
                }
            },
            group: [
                ['target']
            ],
            attributes: [
                'imei',
                'target',
                [db.sequelize.fn('COUNT', db.sequelize.col('target')), 'count_target']
            ]
        });

        console.log(data);
        // Store data in cache for next request
        if (data) {
            await client.set(key, JSON.stringify(data));
        }

        res.json({source: 'database', data});
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});