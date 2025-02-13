const { OpenAI } = require("openai");

require("dotenv").config();

const chatGPT = async (prompt, text) => {
    try {
        const configuration = {
            apiKey: process.env.OPENAI_API_KEY,
        };

        const openai = new OpenAI(configuration);
        
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: text },
            ],
        });
        return response.choices[0].message.content;
    } catch (err) {
        console.error("Error al conectar con OpenAI:", err);
        return {content:'error'};
    }
};

module.exports = {chatGPT};