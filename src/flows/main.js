const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { chatGPT } = require('../utils/gpt')
const { appendToSheet, readSheet } = require('../utils/google/sheet')

const get_word = () => {
    const words = ['sopa']; // Agrega las que quieras
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
};
const reintentos_dias = 2;

const flowEnd = addKeyword(EVENTS.ACTION).addAnswer(
        ['🙌 Espera dos dias para intentarlo de nuevo'],
        { capture: true },
        async (ctx, ctxFn) => {
            console.log('flowEnd');
            // const obtener_diferenciaDias = (fechaInicio) => {
            //     // Convertir las cadenas a objetos Date interpretados en UTC
            //     const inicio = new Date(fechaInicio)  // Ej. "2025-03-01T12:00:00Z"
            //     const fin = new Date() // Fecha y hora actual (en tu zona horaria local)
            //     // Calcular diferencia en milisegundos (fin - inicio)
            //     const diferenciaMs = fin - inicio

            //     // Convertir milisegundos a días
            //     const diferenciaDias = diferenciaMs / (1000 * 60 * 60 * 24)
            //     // Retornar true si la diferencia en días es 2 o más
            //     return diferenciaDias 
            // }

            // let fechaInicio = ctxFn.state.get('fechaInicio');
            // let diferenciaDias = obtener_diferenciaDias(fechaInicio);
            // if (diferenciaDias >= reintentos_dias) {
            //     return ctxFn.flowDynamic(
            //         `¡Hola de nuevo ${ctxFn.state.get('name')}! 👋\n¡Espera *${diferenciaDias} días*, para poder intentarlo de nuevo!`
            //     );
            // } else {
            //     await iniciarJuego(ctxFn);
            //     return await ctxFn.gotoFlow(require('../flows/flowGame'));
            // }
        },
        // [flowGame]
    );

const flowGame = addKeyword(EVENTS.ACTION).addAnswer(
    [
        '¡Adivina la palabra, envía una letra o la palabra completa!'
    ], 
    { capture: true },
    async (ctx, ctxFn) => {
        const maxIntentos = 6;
        let palabraOculta = ctxFn.state.get('palabraOculta');
        let intentosFallidos = ctxFn.state.get('intentosFallidos');
        let palabraAdivinada = ctxFn.state.get('palabraAdivinada');

        const mostrarEstado = () => {
            return `\nPalabra: ${palabraAdivinada.join(' ')}\nIntentos fallidos: ${intentosFallidos}/${maxIntentos}`;
        };

        // Convertimos a minúsculas para uniformidad
        const entrada = ctx.body.toLowerCase();

        // Primero, verificamos si el usuario adivinó la palabra completa
        if (entrada === palabraOculta) {
            return await ctxFn.flowDynamic(
                `¡Felicidades, adivinaste la palabra completa! 🎉\nLa palabra era: ${palabraOculta}`
            );
        }

        // Luego, si no es la palabra completa, validamos si es una sola letra
        if (entrada.length === 1 && /^[a-zñ]$/.test(entrada)) {
            // Si la letra está en la palabra...
            if (palabraOculta.includes(entrada)) {
                // Reemplazamos guiones con la letra adivinada
                for (let i = 0; i < palabraOculta.length; i++) {
                    if (palabraOculta[i] === entrada) {
                        palabraAdivinada[i] = entrada;
                    }
                }
                
                // Actualizamos la palabra adivinada en el estado
                ctxFn.state.update({ palabraAdivinada });

                // ¿Está completa la palabra?
                if (!palabraAdivinada.includes('_')) {
                    await ctxFn.flowDynamic(
                        `¡Felicidades, completaste la palabra! 🎉\nLa palabra era: ${palabraOculta}`
                    );
                    return await ctxFn.gotoFlow(flowEnd);
                }

                // Aún no se completa la palabra; seguimos
                return await ctxFn.fallBack(
                    `¡Bien hecho! La letra "${entrada}" está en la palabra.${mostrarEstado()}`
                );
            } else {
                // La letra no está en la palabra
                intentosFallidos++;
                ctxFn.state.update({ intentosFallidos });

                if (intentosFallidos >= maxIntentos) {
                    await ctxFn.flowDynamic(
                        `¡Has perdido! La palabra era: ${palabraOculta}`
                    );
                    return await ctxFn.gotoFlow(flowEnd);
                }
                return await ctxFn.flowDynamic(
                    `La letra "${entrada}" no está en la palabra.${mostrarEstado()}`
                );
            }
        } else {
            // Si llegó hasta aquí, es porque no es ni la palabra correcta ni una sola letra
            return ctxFn.fallBack(
                "Por favor, ingresa sólo una letra válida (a-z) o intenta adivinar la palabra completa."
            );
        }
    },
    [flowEnd]
);

async function  iniciarJuego(ctxFn) {
    // Generamos y guardamos la palabra oculta
    const fecha = new Date() // Fecha y hora actual (en tu zona horaria local)
    let palabraOculta = get_word();
    ctxFn.state.update({ palabraOculta });
    ctxFn.state.update({ intentosFallidos: 0 });
    ctxFn.state.update({ fechaInicio: fecha.toISOString() });
    // Array con guiones bajos que representan la palabra
    let palabraAdivinada = Array(palabraOculta.length).fill('_');
    ctxFn.state.update({ palabraAdivinada });

    // Mensajes de bienvenida e info inicial
    await ctxFn.flowDynamic(`¡Hola ${ctxFn.state.get('name')}! Perfecto, ya puedes jugar. 🎉`);
    await ctxFn.flowDynamic(`Tienes 6 intentos para adivinar la palabra oculta.`);
    await ctxFn.flowDynamic(`La palabra tiene ${palabraOculta.length} letras.`);
    await ctxFn.flowDynamic(`${palabraAdivinada.join(' ')}`);
}



const flowRegister = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            '¡Hola! Bienvenido a *Toque divino*, tu tienda favorita 🚀',
            'Por favor, dime tu nombre para poder jugar. 🙌'
        ],
        { capture: true },
        async (ctx, ctxFn) => {
            ctxFn.state.update({ name: ctx.body });
            await iniciarJuego(ctxFn);
            return ctxFn.gotoFlow(flowEnd);
        },
        [flowGame, flowEnd]
    );

const flowMain = addKeyword(EVENTS.WELCOME)
    .addAnswer(
        '🙌 Hola, bienvenido a este *Chatbot de Toque divino*',
        { delay: 100 },
        async (ctx, { gotoFlow }) => {
            return gotoFlow(flowRegister);
        },
        [flowRegister]
    );

module.exports = { flowMain, flowRegister, flowGame, flowEnd};
