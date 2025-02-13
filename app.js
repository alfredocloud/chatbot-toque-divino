const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const {flowMain, flowMenu, flowStep3} = require('./src/flows/main')


const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')


const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowMain, flowMenu, flowStep3])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
