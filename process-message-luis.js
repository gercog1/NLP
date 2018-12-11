const Pusher = require('pusher');
const data = require('./data');
const request = require('request');

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    encrypted: true,
});

const getRandom = items => items[Math.floor(Math.random()*items.length)];

const selectFilm = filmGenre => {
    switch (filmGenre) {
        case 'horror':
            return getRandom(data.horrors);
        case 'adventures':
            return getRandom(data.adventures);
        case 'fantasy':
            return getRandom(data.fantasy);
        default:
            return {
                name: 'No name',
                imgUrl: '',
                url: '',
            }

    }
};


const processMessageLuis = (message, res) => {
        request({
            uri: `https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/fcc9b05d-246e-413c-af8b-40147151e277?subscription-key=e35bd007e1c949639a683231bab25612&timezoneOffset=-360&q=${message}`,
        }, (error, response, body) => {
            if(!error && response.statusCode === 200) {
                const json = JSON.parse(body);
                if(json.topScoringIntent.intent === 'film'){
                if(json.entities.length) {
                    return pusher.trigger('bot-luis', 'bot-response-luis', {
                        message:`Suggestions for ${json.entities[0].entity}:`,
                        filmData: selectFilm(json.entities[0].entity),
                    });
                }
                 return pusher.trigger('bot-luis', 'bot-response-luis', {
                    message: "What genre do you like?",
                });
                } else {
                    return pusher.trigger('bot-luis', 'bot-response-luis', {
                        message: "I don`t understand you, could you repeat?",
                    });
                }
            } else {
                res.status(500).json(error);
            }
        });
};

module.exports = processMessageLuis;
