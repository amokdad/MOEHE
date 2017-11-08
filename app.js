    /*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');
var request = require('request');

//var Promise = require('bluebird');


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

function createRecord(complaint){

    /*
    var complaint = {
        Role: role,
        Service: service,
        Name: name,
        Mobile:mobile,
        Recording:recordingsssdaee
    };*/

    request.post({
        headers: {'content-type' : 'application/json'},
        url:     'http://complaintwav1.azurewebsites.net/api/Complaints/PostComplaints',
        body:    JSON.stringify(complaint)
      }, function(error, response, body){
            console.log(JSON.stringify(body));
      });
   

}

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var ArabicRecognizers = {
    arabicRecognizer : new builder.RegExpRecognizer( "Arabic", /العربية/i), 
    englishRecognizer : new builder.RegExpRecognizer( "English", /English/i)
}
var intents = new builder.IntentDialog({ recognizers: [    
    ArabicRecognizers.arabicRecognizer,
    ArabicRecognizers.englishRecognizer] 
,recognizeOrder:"series"})
.matches('English',(session, args) => {
    session.preferredLocale("en",function(err){
        if(!err){
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
        QuestionOne : {
            en:"Student|Parent|Teacher|Nothing",
            ar:"طالب/طالبة|أهل|أستاذ/استاذة|لا أريد الإنتقاء "
        },
        QuestionTwo : {
            en:"اسئلة عامة|تقديم خدمة إلكترونية|إرسال إستفسار إلى إدارة معينة|تقديم/متابعة شكوى",
            ar:"اسئلة عامة|تقديم خدمة إلكترونية|إرسال إستفسار إلى إدارة معينة|تقديم/متابعة شكوى "
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

bot.dialog('/', intents);

bot.dialog("askQuestions",[
    function(session){

        
        builder.Prompts.text(session,'what is your name');  
    },
    function(session,results){
        session.conversationData.name = session.message.text;
        builder.Prompts.text(session,'role');
    },
    function(session,results){
        session.conversationData.role = session.message.text;
        builder.Prompts.text(session,'service');
    },
    function(session,results){ 
        session.conversationData.service = session.message.text;
        builder.Prompts.text(session,'mobile');
    },
    function(session,results){
        session.conversationData.mobile = session.message.text;

        var user =  {Role: session.conversationData.name,
            Service: session.conversationData.role,
            Name: session.conversationData.service,
            Mobile:session.conversationData.mobile
        }
        var reply = createEvent("startRecording", JSON.stringify(user), session.message.address);
        session.send(reply);
        session.endDialog();

    }
]);

bot.dialog("setLanguageWithPic",[
    function(session){
        
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        var txt = session.localizer.gettext("en","selectYourLanguage");
        msg.attachments([
        new builder.HeroCard(session)
            .title("Ministry of Education and Higher Education - وزارة التعليم والتعليم العالي")
            .text(txt)
            .images([builder.CardImage.create(session, "http://complaintwav1.azurewebsites.net/content/images/untitled.png")])
            .buttons([
                builder.CardAction.imBack(session, "English", "English"),
                builder.CardAction.imBack(session, "العربية", "العربية"),
            ])
        ]);
        builder.Prompts.choice(session, msg, "العربية|English");
    },
    function(session,results){
       var locale = program.Helpers.GetLocal(results.response.index);
       session.conversationData.lang = locale;
       session.preferredLocale(locale,function(err){
           if(!err){
              session.replaceDialog("identifyRole");    
           }
       });
       
    }
])
bot.dialog("identifyRole",[
    function(session){
       builder.Prompts.choice(session, "questionOne" ,
       program.Constants.QuestionOne[session.preferredLocale()],{listStyle: builder.ListStyle.button});
    },
    function(session,results){
        session.conversationData.role = results.response.entity;
        builder.Prompts.choice(session, "questionTwo" ,
        program.Constants.QuestionTwo[session.preferredLocale()],{listStyle: builder.ListStyle.button});
    },
    function(session,results){
        session.conversationData.service = results.response.entity;
       /*
        session.send("questionThree");
        var user =  {Role: "session.conversationData.name",
            Service: session.conversationData.role,
            Name: session.conversationData.service,
            Mobile:"session.conversationData.mobile"
        }
        var reply = createEvent("startRecording", JSON.stringify(user), session.message.address);*/
        builder.Prompts.text(session,'يرجى كتابة إسمك أدناه.');  
    },
    function(session,results){
        session.conversationData.name = session.message.text
        session.beginDialog("getMobile");
    }
    ,
    function(session,results){
        session.conversationData.mobile = session.message.text
        session.beginDialog("getEmail");
    },
    function(session,results){
        session.conversationData.email = results.response;
        //builder.Prompts.text(session,"يرجى كتابة بريدك الالكتروني لنقوم بإرسال تفاصيل الشكوى ووسائل المتابعة");

        session.send("questionThree");
        var user =  {Name: session.conversationData.name + " " + session.conversationData.email,
            Service: session.conversationData.role,
            Role: session.conversationData.service,
            Mobile:session.conversationData.mobile
        }
        var reply = createEvent("startRecording", JSON.stringify(user), session.message.address);
        session.send(reply);

    }

]);
bot.dialog("getEmail",[
    function(session,args){
        if (args && args.reprompt) {
            builder.Prompts.text(session, "عفوا، هذا البريد الالكتروني غير صحيح، يرجى المحاولة من جديد.");
        } else {
        builder.Prompts.text(session, "يرجى كتابة بريدك الالكتروني لنقوم بإرسال تفاصيل الشكوى ووسائل المتابعة");
        }
    },
    function(session,results)
    {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(re.test(results.response))
            session.endDialogWithResult(results);
        else
            session.replaceDialog('getEmail', { reprompt: true });
    }
]);
bot.dialog("getMobile",[
    function(session,args){
        if (args && args.reprompt) {
            builder.Prompts.text(session, "عفوا، يجب أن يكون رقم الجوال 8 أرقام على الأقل، يرجى المحاولة من جديد.");
        } else {
        builder.Prompts.text(session, "ما هو رقم جوالك؟");
        }
    },
    function(session,results)
    {
        var re = /[0-9]{8}/;
        if(re.test(results.response))
            session.endDialogWithResult(results);
        else
            session.replaceDialog('getMobile', { reprompt: true });
    }
]);
bot.on("event", function (event) {
    
    var msg = new builder.Message().address(event.address);
    /*
    msg.data.textLocale = "en-us";
    if (event.name === "complaintRecorded") {
        msg.data.text = "We got your complaint recording " + event.value;
    }
    */

    msg.attachmentLayout(builder.AttachmentLayout.carousel);
    var attachments = [];
    msg.text = "something";   
        attachments.push(
             new builder.AudioCard(event.session)
             .title("شكرا، لقد قمنا بإرسال ملخص الشكوى ومعلومات إضافية الى بريدك الالكتروني أدناه، وبإمكانك أن تسألني في أي وقت عن حالة الشكوى إذا لم يصلك أي رد خلال يوم عمل واحد.")
            .media([
                { url: JSON.parse(event.value).recording }
            ])
        );
         
    msg.attachments(attachments);

    createRecord(JSON.parse(event.value));
    bot.send(msg);

    bot.beginDialog("askQuestions"); 

})

const createEvent = (eventName, value, address) => {
    var msg = new builder.Message().address(address);
    msg.data.type = "event";
    msg.data.name = eventName;
    msg.data.value = value;
    return msg;
}

bot.on('conversationUpdate', function (activity) {  
    if (activity.membersAdded) {
        activity.membersAdded.forEach((identity) => {
            if (identity.id === activity.address.bot.id) {
                   bot.beginDialog(activity.address, 'setLanguageWithPic');
             }
         });
    }
 });

 bot.dialog("manualHelpMainMenu",[
    function(session){
        session.replaceDialog("identifyRole");
 }]).triggerAction({matches: /Main Menu|اللائحة الرئيسية/i});

 