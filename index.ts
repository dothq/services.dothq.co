import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'

dotenv.config();

const app = express();

app.use(express.json()); 

app.set('trust proxy', 1);

app.all("/", (req, res) => res.redirect(301, "https://github.com/dothq/services.dothq.co"))

app.get("/download", (req, res) => {
    if(!req.query.product || !req.query.version || !req.query.os) return res.send("Missing parameters.");
})

app.get("/ntp/unsplash", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1
}), (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Expose-Headers", "X-Attribution-Data");

    axios.get(`https://api.unsplash.com/photos/random?collections=67042424&count=50`, { headers: {
        authorization: `Client-ID ${process.env.UNSPLASH_API_KEY}`
    } })
        .then(resp => {
            res.header("X-Attribution-Data", JSON.stringify(resp.data.map((i: any) => { return { 
                p: i.links.html, 
                l: i.location.name, 
                lp: [
                    i.location.position.latitude, 
                    i.location.position.longitude
                ], 
                usn: i.user.username, 
                n: i.user.name 
            } })))
            res.send(resp.data.map((i: any) => { return `${i.urls.raw}&q=50&w=1920` }))
        })
        .catch(e => console.log(e))
})

app.get("/feedback/send", (req, res) => {
    if(
        !req.query ||
        !req.query.version || 
        !req.query.product ||
        !req.query.channel
    ) {
        res.send(`Missing product information.`)
    } else {
        res.sendFile(__dirname + "/send-feedback.html")
    }
})

app.post("/feedback/send", slowDown({
    windowMs: 60 * 60 * 1000,
    delayAfter: 1,
    delayMs: 500
}), (req, res) => {
    if(!req.body) res.end("");
    if(!req.body.version) res.status(400).end("");
    if(!req.body.product) res.status(400).end("");
    if(!req.body.channel) res.status(400).end("");
    if(!req.body.feedback) res.status(400).end("");

    const feedbackWebhook: any = process.env.FEEDBACK_WH;

    if(!feedbackWebhook) res.status(400).end("Error.")

    axios.post(feedbackWebhook, {
        embeds: [
            {
                title: "📣  Feedback",
                color: 3092790,
                timestamp: new Date().toISOString(),
                fields: [
                    {
                        name: "Product",
                        value: req.body.product,
                        inline: true
                    },
                    {
                        name: "Version",
                        value: req.body.version,
                        inline: true
                    },
                    {
                        name: "Channel",
                        value: req.body.channel,
                        inline: true
                    },
                    {
                        name: "Feedback Content",
                        value: `\`\`\`${req.body.feedback}\`\`\``,
                        inline: true
                    }
                ]
            }
        ]
    }).then(resp => res.status(200).end("OK"))
    .catch(resp => res.status(400).end("Error."))
})

app.get("/ntp/news-article-image/proxied", (req, res) => {
    if(!req.query.url) {
        axios.get("https://i.ytimg.com/vi/yL6fMqxynR0/hqdefault.jpg", { responseType: "arraybuffer" })
            .then(_ => res.end(_.data))
    } else {
        axios.get(decodeURIComponent((req.query.url as string)), { responseType: "arraybuffer" })
            .then(_ => res.end(_.data))
    }

});

app.use((req, res, next) => {
    res.status(404)
    res.end(`No service found with that name.`)
})

app.listen(process.env.PORT || 5001);
