/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
 
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    //appId: process.env.MicrosoftAppId,
    //appPassword: process.env.MicrosoftAppPassword,
    appId: "393c6209-b180-441c-ae4e-7b0b62906066",
    appPassword: "plucpNTL2!_rbBCFU5402#|",
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var ArabicRecognizers = {
    arabicRecognizer : new builder.RegExpRecognizer( "Arabic", /(العربية)/i), 
    englishRecognizer : new builder.RegExpRecognizer( "English", /(English)/i)
}
 
/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */
 
// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector,{
    localizerSettings: { 
        defaultLocale: "en" 
    }   
});
 
var program = {

    Constants : {
        StudentParentTeacher : {
            en:"Student|Parent|Teacher|Nothing",
            ar:"طالب/طالبة|أهل|أستاذ/استاذة|لا أريد الإنتقاء "
        },
    },
    Helpers: {
        GetLocal : function(val){
            return val == "1" ? "en" : "ar";
        },
        GetOptions : function(option,locale){
            return option[locale];
        }
    } 
}

bot.dialog("setLanguageWithPic",[
    function(session){
        
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        var txt = session.localizer.gettext("en","selectYourLanguage");
        msg.attachments([
        new builder.HeroCard(session)
            .title("MOEHE")
            .text(txt)
            .images([builder.CardImage.create(session, "https://www.manateq.qa/Style%20Library/MTQ/Images/logo.png")])
            .buttons([
                builder.CardAction.imBack(session, "English", "English"),
                builder.CardAction.imBack(session, "العربية", "العربية"),
            ])
        ]);
        builder.Prompts.choice(session, msg, "العربية|English");
    }
    ,
    function(session,results){
       var locale = program.Helpers.GetLocal(results.response.index);
       session.conversationData.lang = locale;
       session.preferredLocale(locale,function(err){
           if(!err){
              session.replaceDialog("identifyRole");
              session.endDialog();
           }
       });
       
    }
])
bot.dialog("identifyRole",[
    function(session){
       builder.Prompts.choice(session, "identifyRoleText" ,
       program.Constants.StudentParentTeacher[session.preferredLocale()],{listStyle: builder.ListStyle.button});
    },
    function(session,results){
        session.endDialog();
    }
]);

var intents = new builder.IntentDialog({ recognizers: [    
    ArabicRecognizers.arabicRecognizer,
    ArabicRecognizers.englishRecognizer] 
,recognizeOrder:"series"})
.matches('English',(session, args) => {
    session.preferredLocale("en",function(err){
        if(!err){
            session.send("English");
            session.beginDialog("identifyRole");
        }
     });
})

.matches('Arabic',(session, args) => {
    session.preferredLocale("ar",function(err){
        if(!err){
            session.beginDialog("identifyRole");
        }
     });
})



bot.on('conversationUpdate', function (activity) {  
    if (activity.membersAdded) {
        activity.membersAdded.forEach((identity) => {
            if (identity.id === activity.address.bot.id) {
                   bot.beginDialog(activity.address, 'setLanguageWithPic');
             }
         });
    }
 });