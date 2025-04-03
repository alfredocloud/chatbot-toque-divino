const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const {flowMain, flowRegister, flowGame, flowEnd} = require('./src/flows/main')

require("dotenv").config();

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const PostgreSQLAdapter = require('@bot-whatsapp/database/postgres')


const main = async () => {
    const adapterDB = new PostgreSQLAdapter({
            host: process.env.POSTGRES_DB_HOST,
            user: process.env.POSTGRES_DB_USER,
            database: process.env.POSTGRES_DB_NAME,
            password: process.env.POSTGRES_DB_PASSWORD,
            port: process.env.POSTGRES_DB_PORT,
        })
    const adapterFlow = createFlow([flowMain, flowRegister, flowGame, flowEnd])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
