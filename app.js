    /*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');
var request = require('request');
var nodemailer = require('nodemailer');

var DynamicsWebApi = require('dynamics-web-api');

var AuthenticationContext = require('adal-node').AuthenticationContext;

var dynamicsWebApi = new DynamicsWebApi({ 
    webApiUrl: 'https://advancyaad.crm4.dynamics.com/api/data/v8.2/',
    onTokenRefresh: acquireToken
});
var authorityUrl = 'https://login.microsoftonline.com/94aeda88-8526-4ec8-b28f-fa67a055379f/oauth2/token';
var resource = 'https://advancyaad.crm4.dynamics.com';
var clientId = '1ae582b5-4b16-4b40-b180-0239e9b2b947';
var username = 'amokdad@advancyaad.onmicrosoft.com';
var password = 'p@ssw0rd2';
var adalContext = new AuthenticationContext(authorityUrl);

function acquireToken(dynamicsWebApiCallback){
    function adalCallback(error, token) {
        if (!error){
            dynamicsWebApiCallback(token);
            console.log(token);
        }
        else{
            
           // console.log(error);
        }
    }
    adalContext.acquireTokenWithUsernamePassword(resource, username, password, clientId, adalCallback);
}

function CreateContact(contact,crmCase){
  
    dynamicsWebApi.create(contact, "contacts").then(function (response) {
        
       var contactId = response;
       crmCase["customerid_contact@odata.bind"] = "https://advancyaad.crm4.dynamics.com/api/data/v8.2/contacts("+contactId+")";
       crmCase["new_useremail"] = contact.emailaddress1;
       crmCase["new_crmstatus"] = 100000000;
       CreateCase(contact,crmCase);

    })
    .catch(function (error){
        console.log(error);
    });
}
function CreateCase(contact,crmCase){
    
    dynamicsWebApi.create(crmCase, "incidents").then(function (response) {
        
        program.SendEmail({name:contact.firstname ,email:contact.emailaddress1 ,complaint:response});

    })
    .catch(function (error){
        
    });
}

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
     
    var contact = {
        firstname: complaint.Name,mobilephone: complaint.Mobile,emailaddress1: complaint.Email
    };

    var crmCase = {
        title: complaint.Role,new_recording: "https://complaintwav1.azurewebsites.net/" + complaint.recording,
    };

    CreateContact(contact,crmCase);

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
    englishRecognizer : new builder.RegExpRecognizer( "English", /English/i),
    moreInfoRecognizer : new builder.RegExpRecognizer( "MoreInfo", /أريد أن أتصفح المحتوى الخاص/i)
}
var intents = new builder.IntentDialog({ recognizers: [    
    ArabicRecognizers.arabicRecognizer,
    ArabicRecognizers.englishRecognizer,
    ArabicRecognizers.moreInfoRecognizer] 
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
            //session.beginDialog("Testing");
        }
     });
})
.matches('MoreInfo',(session, args) => {
    session.preferredLocale("ar",function(err){
        if(!err){
            session.beginDialog("Testing2");
            //session.beginDialog("Testing");
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

    SendEmail : function(data,locale){
            var html = "<div style='width:100%' dir='rtl'><table><tr><td colspan='2'>عزيزي {{user}}</td></tr><tr><td> رقم الشكوى</td><td>{{complaint}}</td></tr></table></div>";
            var subject = "رقم الشكوى";
            html = html.replace("{{user}}",data.name);
            html = html.replace("{{complaint}}",data.complaint);

            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'rattazataom@gmail.com',
                    pass: '!!xuloloL'
                }
            });
            var mailOptions = {
                from: 'rattazataom@gmail.com',
                to: data.email,
                subject: subject,
                html: html,
                
            };
            transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
            })

    },

    Student:[
        {
            Content:"حصدت دولة قطر 4 ميداليات برونزية في منافسات اولمبياد الكيمياء العربي التي استضافتها  دولة الكويت خلال الفترة من 15-19 اكتوبر الجاري",
            Description:"طلاب قطر يحصدون 4 برونزيات في اولمبياد الكيمياء ",
            Image:"http://www.edu.gov.qa/Ar/Media/News/RelatedPhotos/2342342323243.JPG"
        }, 
        {
            Content:"توجه وفد قطري من طلاب المرحلة الثانوية إلى دولة الكويت الشقيقة للمشاركة في منافسات أولمبياد الكيمياء العربي الثامن والمزمع انعقاده في الفترة من 15 إلى 19 أكتوبر الجاري ",
            Description:"طلاب قطريون يغادرون إلى دولة الكويت",
            Image:"http://www.edu.gov.qa/Ar/Media/News/RelatedPhotos/IMG_4511.JPG"
        }, 
        {
            Content:"تحت شعار ' بالتميز نبني الأجيال' نظمت اللجنة المنظمة لجائزة التميز العلمي في دورتها الحادية عشرة 2018م اليوم ورشة تدريبية خاصة في مكتبة جامعة قطر (بنين وبنات)",
            Description:"انعقاد ورشة تعريفية بجائزة الطالب الجامعي",
            Image:"http://www.edu.gov.qa/Ar/Media/News/RelatedPhotos/2017-10-16-PHOTO-00000106.jpg"
        }
    ],
    Parent:[
        {
            Content:"ناقش الاجتماع الذي عقدته  إدارة التربية الخاصة ورعاية الموهوبين  مع اللجنة الاستشارية للمعلمين في الميدان التعليمي برئاسة السيدة هنادي منصور الخاطر مدير إدارة التربية الخاصة ورعاية الموهوبين",
            Description:"التعليم تناقش مستجدات التربية الخاصة",
            Image:"http://www.edu.gov.qa/Ar/Media/News/RelatedPhotos/mwhobeen453453.jpeg"
        }, 
        {
            Content:"نظم  مشروع مهاراتي بإدارة الطفولة المبكرة ورشة للنواب الإداريين والاخصائيات الاجتماعيات والمشرفات الادارية لمدارس الفوج الاول والثاني الابتدائية تحت مسمى",
            Description:"تمكين أولياء الامور : ورشة للنواب والمشرفات ",
            Image:"http://www.edu.gov.qa/Ar/Media/News/RelatedPhotos/AR7Z7208.jpg"
        }, 
        {
            Content:"عقدت اللجنة المنظمة لجوائز يوم التميز العلمي بفندق هيلتون الدوحة اليوم سبع ورش تدريبية قدمها رؤساء وأعضاء لجان تحكيم فئات الجائزة المختلفة وذلك لتعريف المهتمين بالتقدم لجوائز",
            Description:"ورش تدريبية للمهتمين بالتقدم لجوائز التميز ",
            Image:"http://www.edu.gov.qa/Ar/Media/News/RelatedPhotos/AR7Z6324234533.JPG"
        }
    ],
    Teacher:[
        {
            Content:"صدر سعادة الدكتور محمد بن عبد الواحد الحمادي وزير التعليم والتعليم العالي  قراراً وزارياً بتعيين السيدة ريما محمد أبو خديجة  مديرا لإدارة المناهج الدراسية ومصادر التعلم",
            Description:"ريما أبو خديجة مديرا لإدارة المناهج الدراسية",
            Image:"http://www.edu.gov.qa/Ar/Media/News/PublishingImages/Rema%20Abou%20Khadiga_1.jpg"
        }, 
        {
            Content:"المعلم  والمعلمة لهما  مكانة وأهمية كبيرة في تربية وتعليم الناشئة، لأنهما أساس الحياة والأخلاق، ولهما الفضل الأكبر في حياة الطلاب،  فهما من  يعلمانهم  كيفية حمل القلم والقراءة إلى أن يصلا",
            Description:"مدرسة زينب بنت جحش قالت للمعلمة: لك كل الشكر والتقدير",
            Image:"http://www.edu.gov.qa/Ar/Media/News/RelatedPhotos/zinabBentGahsh934898.jpg"
        }, 
        {
            Content:"بدأ اليوم البرنامج التدريبي حول استخدام تكنولوجيا المعلومات والاتصال في التعليم، والذي نظمه مركز التدريب والتطوير التربوي بالتعاون مع اللجنة الوطنية القطرية للتربية والثقافة والعلوم والمنظمة",
            Description:"بدء البرنامج التدريبي الخاص باستخدام تكنولوجيا",
            Image:"http://www.edu.gov.qa/Ar/Media/News/RelatedPhotos/AR7Z7226.JPG"
        }
    ],
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
bot.dialog("Testing2",[
        function(session){

            var d = [];
            if(session.conversationData.role == "طالب/طالبة"){
                d = program.Student;
            }
            else if(session.conversationData.role== "أهل"){
                d = program.Parent;
            }
            else{
                d = program.Teacher;
            }
            session.conversationData.Option = d;
            var msg = new builder.Message(session);
            msg.attachmentLayout(builder.AttachmentLayout.carousel);
            var attachments = [];
            for(var i in d)
            {
                attachments.push(
                     new builder.HeroCard(session)
                    .title(d[i].Description)
                    .text(d[i].Content.substring(0,150)+"...")
                    .images([builder.CardImage.create(session, d[i].Image)])
                    /*.buttons([
                        builder.CardAction.imBack(session, i, "المزيد")
                    ])*/
                );
            }
            msg.attachments(attachments);
            builder.Prompts.choice(session, msg, d);
        }/*,
        function(session,results){
            var i = results.response;
            var msg = new builder.Message(session);
            msg.attachmentLayout(builder.AttachmentLayout.carousel);
            attachments.push(
                new builder.HeroCard(session)
               .title(session.conversationData.Option[i].Description)
               .text(session.conversationData.Option[i].Content.substring(0,150)+"...")
               .images([builder.CardImage.create(session, session.conversationData.Option[i].Image)])
               
            );
    
        }*/
    ])
bot.dialog("Testing",[

    function(session){
        
        builder.Prompts.choice(session, " لدينا محتوى ومعلومات قد تهمك " + session.conversationData.role,
        "أريد أن أتصفح المحتوى الخاص|الرجوع الى القائمة الرئيسية",{listStyle: builder.ListStyle.button});
        
    }
])
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
              //session.replaceDialog("Testing");  
           }
       });
       
    }
])
bot.dialog("followup",[
    function(session){
        builder.Prompts.text(session,"شكرا، يرجى تزويدنا بالبريد الالكتروني الذي قمت باستخدامه لتقديم الشكوى.");
 
    },
    function(session,results){
      
        var email = session.message.text;
        
        dynamicsWebApi.retrieveAll("incidents", ["title","createdon","new_crmstatus"],"new_useremail eq '" + email + "'").then(function (response) {
            var records = response.value;

            var exist = records != null && records.length >= 1;
            if(exist){

                var date = new Date(response.value[0].createdon).toDateString();
                var incident = response.value[0].incidentid;
                var status = response.value[0].new_crmstatus == 100000000 ? "تحت الاجراء": "مغلقة";

                session.send(" لقد قمت بتقديم شكوى بتاريخ" + date );

                builder.Prompts.text(session," وحالة الشكوى هي" + status);
                
            }
            else{
                
                session.send("عفوا، هذا البريد الالكتروني غير مسجل لدينا");
                builder.Prompts.choice(session, "هل تود المحاولة من جديد أو تقديم شكوى جديدة؟" ,
                "تقديم شكوى جديدة|محاولة من جديد",{listStyle: builder.ListStyle.button});
            }
        })
        .catch(function (error){
            console.log(error);
        });
        
    },function(session,result){
        session.send("final");
    }
]);
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
        session.conversationData.role = results.response.entity;
        builder.Prompts.choice(session, "questionTwo" ,
        "تقديم|متابعة شكوى",{listStyle: builder.ListStyle.button});
    },
    function(session,results){
  
        if(results.response.entity== "متابعة شكوى"){
            
            
            session.replaceDialog("followup");
            
        }
        else{
            session.conversationData.service = results.response.entity;
            builder.Prompts.text(session,'نأسف لوجود شكوى لديكم وسأقوم بمساعدتك لمعالجتها بأسرع وقت ممكن، يرجى كتابة إسمك أدناه');  
    
        }
    },
    function(session,results){
        session.conversationData.name = session.message.text
        session.beginDialog("getMobile");
    },
    function(session,results){
        session.conversationData.mobile = session.message.text
        session.beginDialog("getEmail");
    },
    function(session,results){
        session.conversationData.email = results.response;
        session.send("بإمكانك الضغط على زر 'تسجيل صوتي' لترك رسالة صوتية بسهولة");
        
        var user =  {
            Name: session.conversationData.name,
            Email: session.conversationData.email,
            Service: session.conversationData.role,
            Role: session.conversationData.service,
            Mobile:session.conversationData.mobile
        }
        var reply = createEvent("startRecording", JSON.stringify(user), session.message.address);
        session.send(reply);
        session.endDialog();

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

    
    bot.beginDialog(event.address,"Testing");
    
    /*
    bot.beginDialog({
        to: { address: event.address}
    }, 'Testing');
    //bot.beginDialog("askQuestions"); 
    //*/

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

 