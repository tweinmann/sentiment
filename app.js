 // pull in libraries (test)
 const util = require('util');
 const express = require('express');
 const request = require('request');
 const requestPromise = require('request-promise');
 const Joi = require('joi');
 const MongoClient = require('mongodb').MongoClient;
 const collector = require('./collector');

 // load environment vars
 require('dotenv').config();
 
 // instances
 const app = express();

  // request handler
  app.get('/coin/:q', (req, res) => {
 
    // validate parameters
     const schema = {
        q: Joi.string().min(1).max(50)
     };
     const result = Joi.validate(req.params, schema);
     if(result.error) {
        res.status(400).send(result.error.details[0].message);
        return;
    }  
 
    new Promise((resolve, reject) => {
        var url = process.env.MONGODB_URL;
        MongoClient.connect(url, (err, db) => {
          if (err) reject(err);
          var dbo = db.db("crypto_sentiment");
          var query = { query: result.value.q};
          console.log(query);
          dbo.collection("articles").find(query).toArray(function(err, result) {
            if (err) reject(err);
            db.close();
            resolve(result);
          });
        });
    }).then((result) => {
        return renderHTML(result)
    }).then((result) => {
        res.send(result);
        return;
    }).catch((error) => {
        console.log(error);
        res.sendStatus(500);
        return;
    });
    return;

 });

 function renderHTML(items) {
    console.log("renderHTML");
    var totalScore = 0;
    var html = "<html><body>";
    items.forEach((item) => {
        var score = item.score;
        var background = "rgb(200, 200, 200)"; 
        if(score == 'n/a') {
            background = "rgb(200, 200, 200)"; 
        } else if (score < 0) {
            background = "rgb(255, " + (255+score*10) + ", " + (255+score*10) + ")"; 
        } else if (score > 0 ) {
            background = "rgb(" + (255-score*10) + ", 255, " + (255-score*10) + ")"; 
        }
        totalScore += score;
        html +=  '<div style="box-shadow: 2px 2px gray; border-radius: 10px; width: 22%; height: 60px; overflow: scroll; float: left; font: 12px arial; background: ' + background + '; border: 0px solid gray; margin: 5px; padding: 5px; font: arial"><a href="' + item.url + '">' + item.title + '</a> (' + score + ')</div>'
    });
    html += '<div style="font: 36px arial">' + totalScore + '</div>';
    html += "</body></html>";
    return html;
 }

 app.listen(3000, () => console.log('Listening on port 3000'));
 
 collector.collect();
