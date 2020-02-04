var express = require('express');
var router = express.Router();
const { Curl } = require('node-libcurl');
const querystring = require('querystring');
const axios = require('axios')
const {google} = require('googleapis');
var sheets = google.sheets('v4');
const fs = require('fs');
const readline = require('readline');
/* GET home page. */


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/automation', function(req, res, next) {


    var spreadsheetId= req.query.spreadsheetid;//'1pRKIDhBueVRv6mI7OQXK0xsNTBiQ3Z5xDXQbquKqlJc';
    var metaid =  req.query.metaid;//240
    var sheetname =  req.query.sheetname;

    const data = {
        "username": "Alexandros.synadinos@gugroup.com",
        "password": "19921924"
    };

    axios.post('https://reporting-flashwin.gugroup.com/api/session', data)
        .then(function (response) {





            axios.post('https://reporting-flashwin.gugroup.com/api/card/'+metaid+'/query/json', {},
                {
                    headers: {
                        "X-Metabase-Session": response.data.id.toString()
                    }
                }
            )
                .then(function (response) {


                    var report_data= [];

                    for(var i=0; i< response.data.length; i++){

                        var j=0;
                        var tempdata=[];
                            for (var key in response.data[i]){
                            tempdata.push(response.data[i][key]);
                            j++;
                        }
                        report_data.push(tempdata);


                    }
                    // If modifying these scopes, delete token.json.
                    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
                    // The file token.json stores the user's access and refresh tokens, and is
                    // created automatically when the authorization flow completes for the first
                    // time.
                    const TOKEN_PATH = 'token.json';

                    // Load client secrets from a local file.
                    fs.readFile('credentials.json', (err, content) => {
                        if (err) return console.log('Error loading client secret file:', err);
                        // Authorize a client with credentials, then call the Google Sheets API.
                        authorize(JSON.parse(content), update_sheet);
                    });

                    /**
                     * Create an OAuth2 client with the given credentials, and then execute the
                     * given callback function.
                     * @param {Object} credentials The authorization client credentials.
                     * @param {function} callback The callback to call with the authorized client.
                     */
                    function authorize(credentials, callback) {
                        const {client_secret, client_id, redirect_uris} = credentials.installed;
                        const oAuth2Client = new google.auth.OAuth2(
                            client_id, client_secret, redirect_uris[0]);

                        // Check if we have previously stored a token.
                        fs.readFile(TOKEN_PATH, (err, token) => {
                            if (err) return getNewToken(oAuth2Client, callback);
                            oAuth2Client.setCredentials(JSON.parse(token));
                            callback(oAuth2Client);
                        });
                    }

                    /**
                     * Get and store new token after prompting for user authorization, and then
                     * execute the given callback with the authorized OAuth2 client.
                     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
                     * @param {getEventsCallback} callback The callback for the authorized client.
                     */
                    function getNewToken(oAuth2Client, callback) {
                        const authUrl = oAuth2Client.generateAuthUrl({
                            access_type: 'offline',
                            scope: SCOPES,
                        });
                        console.log('Authorize this app by visiting this url:', authUrl);
                        const rl = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout,
                        });
                        rl.question('Enter the code from that page here: ', (code) => {
                            rl.close();
                            oAuth2Client.getToken(code, (err, token) => {
                                if (err) return console.error('Error while trying to retrieve access token', err);
                                oAuth2Client.setCredentials(token);
                                // Store the token to disk for later program executions
                                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                                    if (err) return console.error(err);
                                    console.log('Token stored to', TOKEN_PATH);
                                });
                                callback(oAuth2Client);
                            });
                        });
                    }

                    /**
                     * Prints the names and majors of students in a sample spreadsheet:
                     * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                     * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
                     */
                    function update_sheet(auth ) {
                        const sheets = google.sheets({version: 'v4', auth});

                        sheets.spreadsheets.values.clear({
                            spreadsheetId:spreadsheetId,
                            range: sheetname+'!A2:E'
                        }, (err, result) => {
                            if (err) {
                                // Handle error.
                                console.log(err);
                            } else {
                                console.log(`Cells deleted in sheet:` + spreadsheetId +' with metabase id:' + metaid);
                                let values = report_data; /*[
                            [
                                // Cell values ...
                                username , timestamp , a1 , a2 , a3
                            ]
                            // Additional rows ...
                        ];*/
                                let resource = {
                                    values,
                                };
                                sheets.spreadsheets.values.update({
                                    spreadsheetId:spreadsheetId,
                                    range: sheetname+'!A2:E',
                                    valueInputOption: 'USER_ENTERED',
                                    resource,
                                }, (err, result) => {
                                    if (err) {
                                        // Handle error.
                                        console.log(err);
                                    } else {
                                        console.log(`Cells updated in sheet:` + spreadsheetId +' with metabase id:' + metaid);
                                        console.log('==================');
                                    }
                                });
                            }
                        });





                    }




                })
                .catch(function (error) {
                    console.log(error);
                });



    })
        .catch(function (error) {
            console.log(error);
        });



});


router.get('/metabasecron', function(req, res, next) {
    var url = request.headers.host;


    var CronJob = require('cron').CronJob;
    //new CronJob('00 00 00 * * *', function() {
    new CronJob('* * * * * *', function() {

        axios.get('http://localhost:3000/automation?metaid=133&spreadsheetid=1AZYEgYISOznG6A7DUUG6fnTGXKre8P9o3hNBKFjsO6A&sheetname=RevenuesPerDate')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });


        axios.get('http://localhost:3000/automation?metaid=135&spreadsheetid=1AZYEgYISOznG6A7DUUG6fnTGXKre8P9o3hNBKFjsO6A&sheetname=RevenuesPerFirstSubDate')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });


        axios.get('http://localhost:3000/automation?metaid=134&spreadsheetid=1AZYEgYISOznG6A7DUUG6fnTGXKre8P9o3hNBKFjsO6A&sheetname=Subscribers')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });


        axios.get('http://localhost:3000/automation?metaid=142&spreadsheetid=1AZYEgYISOznG6A7DUUG6fnTGXKre8P9o3hNBKFjsO6A&sheetname=UnSubscribers')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });


    }, null, true, 'America/Los_Angeles');


});


router.get('/metabasecroneg', function(req, res, next) {

    var url = req.headers.host;

    console.log("REQUEST TO " + url);
    var CronJob = require('cron').CronJob;
    //new CronJob('00 00 00 * * *', function() {
    new CronJob('59 * * * * *', function() {

        axios.get('http://localhost:3000/automation?metaid=1607&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=arabclicks')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });


        axios.get('http://localhost:3000/automation?metaid=1641&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=arabyads')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });


        axios.get('http://localhost:3000/automation?metaid=1650&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=armorads')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });

        axios.get('http://localhost:3000/automation?metaid=1659&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=facebook')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });

        axios.get('http://localhost:3000/automation?metaid=1668&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=google')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });

        axios.get('http://localhost:3000/automation?metaid=1677&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=instagram')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });

        axios.get('http://localhost:3000/automation?metaid=1686&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=netaffiliation')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });


        axios.get('http://localhost:3000/automation?metaid=1695&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=voice')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });

        axios.get('http://localhost:3000/automation?metaid=1704&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=wizzo')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });

        axios.get('http://localhost:3000/automation?metaid=1735&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=nosource')
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });


    }, null, true, 'America/Los_Angeles');


});




module.exports = router;
