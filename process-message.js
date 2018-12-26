const Dialogflow = require('dialogflow');
const swipl = require('swipl-stdio');

const prepend = require('prepend');
const Pusher = require('pusher');
const data = require('./data');

const engine = new swipl.Engine();
engine.call(`working_directory(_, '/Users/bohdantverdoukh/Desktop/nlp')`);
engine.call(`consult('base.pl')`);

const onlyUnique = (value, index, self) => {
    return self.indexOf(value) === index;
};

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

const sessionClient = new Dialogflow.SessionsClient(config);

const sessionPath = sessionClient.sessionPath(projectId, sessionId);

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

      console.log(result.parameters);

      if ( result.intent && result.intent.displayName === 'sayName' && result.parameters.fields['film'].stringValue && result.parameters.fields['name'].stringValue) {
        const filmGenre = result.parameters.fields['film'].stringValue;
        const name = result.parameters.fields['name'].stringValue;

          (async () => {
              const result = await engine.call(`assert_fact('${name}','${filmGenre}')`);

              if (result) {
                  console.log(`Cool`);
              } else {
                  console.log('Call failed.');
              }

          })().catch((err) => console.log(err));

            return pusher.trigger('bot', 'bot-response', {
                message: result.fulfillmentText,
            });
      }

        if ( result.intent && result.intent.displayName === 'sayName - yes - custom' && result.parameters.fields['film'].stringValue) {
            const filmGenre = result.parameters.fields['film'].stringValue;
            const name = result.parameters.fields['name'].stringValue;

            (async () => {
                const result = await engine.call(`assert_fact('${name}','${filmGenre}')`);

                if (result) {
                    console.log(`Cool`);
                } else {
                    console.log('Call failed.');
                }

            })().catch((err) => console.log(err));

            return pusher.trigger('bot', 'bot-response', {
                message: result.fulfillmentText,
            });
        }

        if (result.intent && result.intent.displayName === 'suggestFilmFor') {
            const name = result.parameters.fields['name'].stringValue;
            let categories = [];

            (async () => {
                const query = await engine.createQuery(`fact('${name}', X)`);
                try {
                    let result;
                    while (result = await query.next()) {
                        categories.push(result.X);
                    }
                } finally {
                    await query.close();
                    if(categories.length > 0) {
                        pusher.trigger('bot', 'bot-response', {
                            message: `Suggested genres for ${name}: ${categories.filter(onlyUnique).join(' ')}`,
                            suggestedGenres: categories.filter(onlyUnique),
                        });

                    } else {
                        pusher.trigger('bot', 'bot-response', {
                            message: `There is no suggestions for ${name}`,
                        });
                    }
                }
            })().catch((err) => console.log(err));

            return;
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
