const sgMail = require('@sendgrid/mail');


sgMail.setApiKey(process.env.SENDGRID_API_KEY)


const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'taskManager@salzaidy.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
        // html: this you include pics 
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'taskManager@salzaidy.com',
        subject: 'GoodBye!',
        text: `We are sorry to see you go, ${name}. Let us know how we improve our services.`
        // html: this you include pics 
    })
}



module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}