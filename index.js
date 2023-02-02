require("dotenv").config();

// This is the core of the "bot"
var framework = require("webex-node-bot-framework");

// This is what enables webhooks
var webhook = require("webex-node-bot-framework/webhook");

var express = require("express");

var bodyParser = require("body-parser");

var fetch = require('node-fetch');

var app = express();

app.use(bodyParser.json());

app.use(express.static("images"));
const config = {
  webhookUrl: process.env.WEBHOOKURL,
  token: process.env.BOTTOKEN,
  port: process.env.PORT,
};

// init framework
var framework = new framework(config);
framework.start();
console.log("Loading Webex Bot by Nathaniel Scholze...");

// Start fw
framework.on("initialized", () => {
  console.log("Bot is running! Press [Ctrl-C] to stop the bot.");
});

// These are the functions that happen when the bot loads
// This should only consist of finding what rooms it is in, and listing for being added to new rooms
// This will also send welcome messages to new rooms it is added to
framework.on("spawn", (bot, id, actorId) => {
  if (!actorId) {
    // don't say anything here or your bot's spaces will get
    // spammed every time your server is restarted
    console.log(
      `Our bot has been found!: ${bot.room.title}`
    );
  } else {
    // When actorId is present it means someone added your bot got added to a new space
    // Lets find out more about them..
    var msg =
      "Say 'help' to get started!";
    bot.webex.people
      .get(actorId)
      .then((user) => {
        msg = `Hello ${user.displayName}. ${msg}`;
      })
      .catch((e) => {
        console.error(
          `Failed to lookup user details in framwork.on("spawn"): ${e.message}`
        );
        msg = `Hello there. ${msg}`;
      })
      .finally(() => {
        // Say hello, and tell users what you do!
        if (bot.isDirect) {
          bot.say("markdown", msg);
        } else {
          let botName = bot.person.displayName;
          msg += `\n\nDon't forget, in order for me to see your messages in this group space, be sure to *@mention* ${botName}.`;
          bot.say("markdown", msg);
        }
      });
  }
});

// Implementing a framework.on('log') handler allows you to capture
// events emitted from the framework.  Its a handy way to better understand
// what the framework is doing when first getting started, and a great
// way to troubleshoot issues.
// You may wish to disable this for production apps
framework.on("log", (msg) => {
  console.log(msg);
});



/* On mention with bot data 
ex User enters @botname 'space' phrase, the bot will provide details about that particular space
*/
framework.hears(
  "space",
  (bot) => {
    console.log("User asked for space details.");
    let roomTitle = bot.room.title;
    let spaceID = bot.room.id;
    let roomType = bot.room.type;

    let outputString = `The title of this space: ${roomTitle} \n\n The roomID of this space: ${spaceID} \n\n The type of this space: ${roomType}`;

    console.log(outputString);
    bot
      .say("markdown", outputString)
      .catch((e) => console.error(`bot.say failed: ${e.message}`));
  },
  "**space**: Retrieve room id etc",
  0
);
// THE BIG INPUT FORM
let cadJSON = {
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.2",
  "body": [
      {
          "type": "TextBlock",
          "text": "Jabber Issue Report",
          "wrap": true,
          "id": "1"
      },
      {
          "type": "Input.ChoiceSet",
          "choices": [
              {
                  "title": "Inbound",
                  "value": "Inbound"
              },
              {
                  "title": "Outbound",
                  "value": "Outbound"
              }
          ],
          "placeholder": "Direction of call",
          "id": "CallDirection",
          "separator": true
      },
      {
          "type": "Input.Text",
          "placeholder": "Source Phone #",
          "style": "Tel",
          "id": "SourceNum",
          "separator": true
      },
      {
          "type": "Input.Text",
          "placeholder": "Dialed Phone #",
          "style": "Tel",
          "id": "DialedNum",
          "separator": true
      },
      {
          "type": "Input.Date",
          "id": "Date",
          "separator": true
      },
      {
          "type": "Input.Time",
          "id": "Time",
          "value": "12:00",
          "separator": true
      },
      {
          "type": "Input.Text",
          "placeholder": "AgentPhone#",
          "style": "Tel",
          "id": "AgentNum",
          "separator": true
      },
      {
          "type": "Input.Text",
          "placeholder": "AgentEmail",
          "style": "Email",
          "id": "AgentEmail",
          "separator": true
      },
      {
          "type": "Input.Text",
          "id": "Issue",
          "placeholder": "Issues/ Symptoms",
          "separator": true
      },
      {
          "type": "ActionSet",
          "actions": [
              {
                  "type": "Action.Submit",
                  "title": "Submit"
              }
          ],
          "horizontalAlignment": "Center",
          "spacing": "None",
          "id": "10"
      }
  ],
  "backgroundImage": {
      "url": "https://wallpapercave.com/wp/wp7335958.jpg"
  }
};

// THIS SENDS THE FORM WHEN IT RECEIVES THE MESSAGE 'ISSUE'
framework.hears(
  "issue",
  (bot, trigger) => {
    console.log("someone asked for a card");
    bot.sendCard(
      cadJSON,
      "This is customizable fallback text for clients that do not support buttons & cards"
    );
  },
  "**issue**: Sends the issue form",
  0
);

// SEND USER SUBMITTED INFO CARD
framework.on('attachmentAction', function (bot, trigger) {
  let attachmentAction = trigger.attachmentAction
  const outp = `${JSON.stringify(attachmentAction, null, 2)}`;
  var params = JSON.parse(outp);
  let caJSON = {
    "type": "AdaptiveCard",
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "version": "1.2",
    "body": [
        {
            "type": "RichTextBlock",
            "inlines": [
                {
                    "type": "TextRun",
                    "text": "Submitted by: " + trigger.person.displayName
                }
            ],
            "horizontalAlignment": "Center"
        },
        {
            "type": "RichTextBlock",
            "inlines": [
                {
                    "type": "TextRun",
                    "text": "Source Number: " + params.inputs.SourceNum
                }
            ],
            "horizontalAlignment": "Center"
        },
        {
            "type": "RichTextBlock",
            "inlines": [
                {
                    "type": "TextRun",
                    "text": "Dialed Number: " + params.inputs.DialedNum
                }
            ],
            "horizontalAlignment": "Center"
        },
        {
            "type": "RichTextBlock",
            "inlines": [
                {
                    "type": "TextRun",
                    "text": "Date: " + params.inputs.Date
                }
            ],
            "horizontalAlignment": "Center"
        },
        {
            "type": "RichTextBlock",
            "inlines": [
                {
                    "type": "TextRun",
                    "text": "Time: " + params.inputs.Time
                }
            ],
            "horizontalAlignment": "Center"
        },
        {
            "type": "RichTextBlock",
            "inlines": [
                {
                    "type": "TextRun",
                    "text": "Agent Phone #: " + params.inputs.AgentNum
                }
            ],
            "horizontalAlignment": "Center"
        },
        {
            "type": "RichTextBlock",
            "inlines": [
                {
                    "type": "TextRun",
                    "text": "Agent Email: " + params.inputs.AgentEmail
                }
            ],
            "horizontalAlignment": "Center"
        },
        {
            "type": "RichTextBlock",
            "inlines": [
                {
                    "type": "TextRun",
                    "text": "Issue: " + params.inputs.Issue
                }
            ],
            "horizontalAlignment": "Center"
        }
    ]
  }
  
  fetch("https://webexapis.com/v1/webhooks/incoming/Y2lzY29zcGFyazovL3VzL1dFQkhPT0svZTdiYzliMjYtZmFiYy00ZDQ2LWFjMTEtNTE3YTAxNDZmOWU5", {
  method: "POST",
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },

  //make sure to serialize your JSON body
  body: JSON.stringify({
    text: 'Submitted by: ' + trigger.person.displayName + '\n' + 'Inbound/ Outbound: ' + params.inputs.CallDirection + '\n' + 'Source #: ' + params.inputs.SourceNum + '\n' + 'Dialed #: ' + params.inputs.DialedNum + '\n' + 'Date: ' + params.inputs.Date + '\n' + 'Time: ' + params.inputs.Time + '\n' + 'Agents #: ' + params.inputs.AgentNum + '\n' + 'Agent Email: ' + params.inputs.AgentEmail + '\n' + 'Issue: ' + params.inputs.Issue
  })
});
fetch("https://webexapis.com/v1/messages/" + params.messageId, {
  method: "DELETE"
})
.then( (response) => { 
   //do something awesome that makes the world a better place
});
  bot
  .sendCard(
    caJSON,
    "Something went wrong"
  );
  bot.say(
    'Your report has been sent. Thank you!' 
  )
});


// THIS RESPONDS TO THE HELP COMMAND
framework.hears(
  /help|what can i (do|say)|what (can|do) you do/i,
  (bot, trigger) => {
    console.log(`someone needs help! They asked ${trigger.text}`);
    bot
      .say(`Hello ${trigger.person.displayName}.`)
      //    .then(() => sendHelp(bot))
      .then(() => bot.say("markdown", framework.showHelp()))
      .catch((e) => console.error(`Problem in help hander: ${e.message}`));
  },
  "**help**: (what you are reading now)",
  0
);

// THIS HANDLES ALL UNKOWN MESSAGES
framework.hears(
  /.*/,
  (bot, trigger) => {
    // This will fire for any input so only respond if we haven't already
    console.log(`catch-all handler fired for user input: ${trigger.text}`);
    bot
      .say(`Sorry, I don't know how to respond to "${trigger.text}"`)
      .then(() => bot.say("markdown", framework.showHelp()))
      //    .then(() => sendHelp(bot))
      .catch((e) =>
        console.error(`Problem in the unexepected command hander: ${e.message}`)
      );
  },
  99999
);

//Server config & housekeeping
// Health Check
app.get("/", (req, res) => {
  res.send(`I'm alive.`);
});

app.post("/", webhook(framework));

// Allows the framework to start listening
var server = app.listen(config.port, () => {
  framework.debug("framework listening on port %s", config.port);
});

// gracefully shutdown (ctrl-c)
process.on("SIGINT", () => {
  framework.debug("stopping...");
  server.close();
  framework.stop().then(() => {
    process.exit();
  });
});
