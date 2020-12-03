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
            res.send(resp.data.map((i: any) => { return i.urls.full }))
        })
        .catch(e => console.log(e))
})

app.use((req, res, next) => {
    res.status(404)
    res.end(`No service found with that name.`)
})

app.listen(process.env.PORT || 5001);
