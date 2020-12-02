import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit'

dotenv.config();

const app = express();

app.set('trust proxy', 1);

app.all("/", (req, res) => res.redirect(301, "https://github.com/dothq/services.dothq.co"))

app.get("/download", (req, res) => {
    if(!req.query.product || !req.query.version || !req.query.os) return res.send("Missing parameters.");
})

app.get("/ntp/unsplash", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1
}), (req, res) => {
    axios.get(`https://api.unsplash.com/photos/random?collections=67042424&count=1`, { headers: {
        authorization: `Client-ID ${process.env.UNSPLASH_API_KEY}`
    } })
        .then(resp => res.send(resp.data))
        .catch(e => console.log(e))
})

app.use((req, res, next) => {
    res.status(404)
    res.end(`No service found with that name.`)
})

app.listen(process.env.PORT || 5000);