const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { chatGPT } = require('../utils/gpt')
const { appendToSheet, readSheet } = require('../utils/google/sheet')

const fs = require("fs")

const promptStep3Path = './src/message/prompt_step3.txt'
const promptStep3 = fs.readFileSync(promptStep3Path, "utf8")



const flowStep1_1 = addKeyword(EVENTS.ACTION).addAnswer([' flowStep1_1']).addAnswer('Primero, ¿me puedes dar tu nombre? 🙌', { capture: true },
    async (ctx, ctxFn) => {
        console.log('ctxFnstate: ', ctxFn.state)
        return await ctxFn.state.update({ name: ctx.body })

    }
)

const flowStep1_2 = addKeyword(EVENTS.ACTION).addAnswer(['Eres un consultorio de medicina general y se tiene que agendar una consulta flowStep1_2'])
const flowStep1_3 = addKeyword(EVENTS.ACTION).addAnswer(['Eres un consultorio de medicina general y se tiene que agendar una consulta flowStep1_3'])


const flowStep1 = addKeyword(EVENTS.ACTION).addAnswer(
    [
        'Aqui te dejo los casos de uso! Selecciona una opción:',
        '',
        '*1.* Agendar una cita ⭐',
        '*2.* Chatbot de ventas ❓',
        '*3.* Registrar pedidos 🚀',
    ],
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        if (!["1", "2", "3", "0"].includes(ctx.body)) {
            return fallBack(
                "Respuesta no válida, por favor selecciona una de las opciones."
            );
        }
        switch (ctx.body) {
            case "1":
                return gotoFlow(flowStep1_1);
            case "2":
                return gotoFlow(flowStep1_2);
            case "3":
                return gotoFlow(flowStep1_3);
            case "0":
                await flowDynamic(
                    "Saliendo... Puedes volver a acceder a este menú escribiendo *Menu*"
                );
        }
    },
    [flowStep1_1, flowStep1_2, flowStep1_3]
)
const flowStep2 = addKeyword(EVENTS.ACTION).addAnswer("Soy tu asistente virtual de *Iriss Evolution*.\n\n En que te puedo ayudar? ",
    { capture: true },
    async (ctx, ctxFn) => {
        const text = ctx.body
        console.log(promptStep3)
        const prompt = promptStep3
        const answer = await chatGPT(prompt, text)
        await ctxFn.flowDynamic(answer)
    })


const flowStep3 = addKeyword(EVENTS.ACTION).addAnswer(
    ['¡Perfecto! 🎉 Estás en el lugar correcto. Para darte una demo del chatbot que puede transformar tu negocio, necesito algunos datos.'])
    .addAnswer('Primero, ¿me puedes dar tu nombre? 🙌', { capture: true },
        async (ctx, ctxFn) => {
            console.log('nombre', ctx.body)
            return await ctxFn.state.update({ name: ctx.body })

        }
    )
    .addAnswer('Ahora, ¿cuál es tu correo electrónico? 📧', { capture: true },
        async (ctx, ctxFn) => {
            console.log('correo', ctx.body)
            await ctxFn.state.update({ email: ctx.body })
        }
    )
    .addAnswer('¡Gracias! 👍 ¿Y cómo se llama tu negocio? 🏢', { capture: true },
        async (ctx, ctxFn) => {
            console.log('company_name', ctx.body)
            await ctxFn.state.update({ company_name: ctx.body })
        }
    )    
    .addAnswer('Por último, ¿podrías contarme por qué quieres implementar un chatbot en tu negocio? 🤔', { capture: true },
        async (ctx, ctxFn) => {
            console.log('company_description', ctx.body)
            await ctxFn.state.update({ company_description: ctx.body })
        }
    )
    .addAnswer('¡Súper! Un chatbot puede ayudarte muchísimo con eso. 💪 Vamos a enviarte toda la información para que veas lo fácil y eficiente que puede ser. 😁', null,
        async (ctx, ctxFn) => {
            const name = ctxFn.state.get("name")
            const email = ctxFn.state.get("email")
            const company_name = ctxFn.state.get("company_name")
            const company_description = ctxFn.state.get("company_description")
            console.log(name, email, company_name, company_description)
            await appendToSheet([[name, email, company_name, company_description]])
        }
    )


const flowMenu = addKeyword(['hola', 'ole', 'alo', 'menu', 'principal'])
    .addAnswer(
        [
            '¡Hola! Soy tu asistente Iriss Bot ¿En qué puedo ayudarte hoy? Selecciona una opción:',
            '',
            '*1.* Ejemplos de uso ⭐',
            '*2.* Preguntas frecuentes ❓',
            '*3.* Implementar chatbot en mi negocio 🚀',
        ],
        { capture: true },
        async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            if (!["1", "2", "3", "0"].includes(ctx.body)) {
                return fallBack(
                    "Respuesta no válida, por favor selecciona una de las opciones."
                );
            }
            switch (ctx.body) {
                case "1":
                    return gotoFlow(flowStep1);
                case "2":
                    return gotoFlow(flowStep2);
                case "3":
                    return gotoFlow(flowStep3);
                case "0":
                    await flowDynamic(
                        "Saliendo... Puedes volver a acceder a este menú escribiendo *Menu*"
                    );
            }
        },
        [flowStep1, flowStep2, flowStep3]
    )

const flowMain = addKeyword(EVENTS.WELCOME)
    .addAnswer('🙌 Hola bienvenido a este *Chatbot de Iriss Evolution*', {
        delay: 100,
    },
        async (ctx, { gotoFlow }) => {
            return gotoFlow(flowMenu)
        },
        [flowMenu])


module.exports = { flowMain, flowMenu, flowStep3};