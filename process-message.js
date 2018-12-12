const Dialogflow = require('dialogflow');
const prepend = require('prepend');
const Pusher = require('pusher');
const data = require('./data');

const projectId = 'film-401ba';
const sessionId = '123456';
const languageCode = 'en-US';

const config = {
  credentials: {
    private_key: process.env.DIALOGFLOW_PRIVATE_KEY,
    client_email: process.env.DIALOGFLOW_CLIENT_EMAIL,
  },
};

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER,
  encrypted: true,
});

const getRandom = items => items[Math.floor(Math.random()*items.length)];

const sessionClient = new Dialogflow.SessionsClient(config);

const sessionPath = sessionClient.sessionPath(projectId, sessionId);

const selectFilm = filmGenre => {
    switch (filmGenre) {
        case 'Horror':
            return getRandom(data.horrors);
        case 'Adventures':
            return getRandom(data.adventures);
        case 'Fantasy':
            return getRandom(data.fantasy);
        default:
            return {
                name: 'No name',
                imgUrl: '',
                url: '',
            }

    }
};


const processMessage = message => {
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode,
      },
    },
  };

  sessionClient
    .detectIntent(request)
    .then(responses => {
      const result = responses[0].queryResult;


      if (result.intent.displayName === 'sayName' && result.parameters.fields['film'].stringValue && result.parameters.fields['name'].stringValue) {
        const filmGenre = result.parameters.fields['film'].stringValue;
        const name = result.parameters.fields['name'].stringValue;
          prepend('knowledge.pl', `like(${name},${filmGenre}).`, function(error) {
              if (error)
                  console.error(error.message);
          });

        if(filmGenre) {
            return pusher.trigger('bot', 'bot-response', {
                message:`Suggestions for ${name}, ${filmGenre}:`,
                filmData: selectFilm(filmGenre),
            });
        }
      }

        return pusher.trigger('bot', 'bot-response', {
        message: result.fulfillmentText,
      });
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
};

module.exports = processMessage;
