var express = require('express');
var router = express.Router();
/*
const { Curl } = require('node-libcurl');

const querystring = require('querystring');
*/
const axios = require('axios')
const {google} = require('googleapis');
var sheets = google.sheets('v4');
const fs = require('fs');
const readline = require('readline');
const moment = require('moment');
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
                                res.send('ERROR in delete');
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
                                        res.send('ERROR in update');
                                        console.log(err);
                                    } else {
                                        res.send('OK delete-update');
                                        console.log(`Cells updated in sheet:` + spreadsheetId +' with metabase id:' + metaid);
                                        console.log('==================');

                                    }
                                });
                            }
                        });





                    }




                })
                .catch(function (error) {
                    res.send('Error fetching metabase report. Maybe check query');
                    console.log(error);
                });



    })
        .catch(function (error) {
            res.send('Error getting metabase auth.');
            console.log(error);
        });



});


router.get('/metabasecron', function(req, res, next) {
    var url = req.headers.host;

    var CronJob = require('cron').CronJob;
    //new CronJob('00 00 00 * * *', function() {
    var job = new CronJob('* 1 * * * *', function() {

        axios.get('http://'+url+'/automation?metaid=133&spreadsheetid=1AZYEgYISOznG6A7DUUG6fnTGXKre8P9o3hNBKFjsO6A&sheetname=RevenuesPerDate')
            .then(function (response) {
                // handle success
                axios.get('http://'+url+'/automation?metaid=135&spreadsheetid=1AZYEgYISOznG6A7DUUG6fnTGXKre8P9o3hNBKFjsO6A&sheetname=RevenuesPerFirstSubDate')
                    .then(function (response) {
                        // handle success
                        axios.get('http://'+url+'/automation?metaid=134&spreadsheetid=1AZYEgYISOznG6A7DUUG6fnTGXKre8P9o3hNBKFjsO6A&sheetname=Subscribers')
                            .then(function (response) {
                                // handle success
                                axios.get('http://'+url+'/automation?metaid=142&spreadsheetid=1AZYEgYISOznG6A7DUUG6fnTGXKre8P9o3hNBKFjsO6A&sheetname=UnSubscribers')
                                    .then(function (response) {
                                        // handle success
                                        console.log("ROI - 4 exports ran succesfully at :"+moment().format());
                                    })
                                    .catch(function (error) {
                                        // handle error
                                        console.log(error);
                                    });
                            })
                            .catch(function (error) {
                                // handle error
                                console.log(error);
                            });
                    })
                    .catch(function (error) {
                        // handle error
                        console.log(error);
                    });
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });











    }, null, true, 'America/Los_Angeles');
    job.start();

    res.send('OK first');


});

router.get('/metabasecroneg', function(req, res, next) {

    var url = req.headers.host;

    var CronJob = require('cron').CronJob;
    //new CronJob('00 00 00 * * *', function() {
    var job = new CronJob('* 5 16 * * *', function() {

        axios.get('http://'+url+'/automation?metaid=1607&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=arabclicks')
            .then(function (response) {
                // handle success

                axios.get('http://'+url+'/automation?metaid=1641&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=arabyads')
                    .then(function (response) {
                        // handle success

                        axios.get('http://'+url+'/automation?metaid=1650&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=armorads')
                            .then(function (response) {
                                // handle success

                                axios.get('http://'+url+'/automation?metaid=1659&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=facebook')
                                    .then(function (response) {
                                        // handle success

                                        axios.get('http://'+url+'/automation?metaid=1668&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=google')
                                            .then(function (response) {
                                                // handle success

                                                axios.get('http://'+url+'/automation?metaid=1677&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=instagram')
                                                    .then(function (response) {
                                                        // handle success

                                                        axios.get('http://'+url+'/automation?metaid=1686&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=netaffiliation')
                                                            .then(function (response) {
                                                                // handle success

                                                                axios.get('http://'+url+'/automation?metaid=1695&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=voice')
                                                                    .then(function (response) {
                                                                        // handle success

                                                                        axios.get('http://'+url+'/automation?metaid=1704&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=wizzo')
                                                                            .then(function (response) {
                                                                                // handle success

                                                                                axios.get('http://'+url+'/automation?metaid=1735&spreadsheetid=13MvAUFQ8u-BvsyUHr3co6Hrxfo0WM-wtk9Ix7nDK5rk&sheetname=nosource')
                                                                                    .then(function (response) {
                                                                                        // handle success
                                                                                        console.log("EG LTV- 10 exports ran succesfully at :"+moment().format());
                                                                                    })
                                                                                    .catch(function (error) {
                                                                                        // handle error
                                                                                        console.log(error);
                                                                                    });
                                                                            })
                                                                            .catch(function (error) {
                                                                                // handle error
                                                                                console.log(error);
                                                                            });
                                                                    })
                                                                    .catch(function (error) {
                                                                        // handle error
                                                                        console.log(error);
                                                                    });
                                                            })
                                                            .catch(function (error) {
                                                                // handle error
                                                                console.log(error);
                                                            });
                                                    })
                                                    .catch(function (error) {
                                                        // handle error
                                                        console.log(error);
                                                    });
                                            })
                                            .catch(function (error) {
                                                // handle error
                                                console.log(error);
                                            });
                                    })
                                    .catch(function (error) {
                                        // handle error
                                        console.log(error);
                                    });
                            })
                            .catch(function (error) {
                                // handle error
                                console.log(error);
                            });
                    })
                    .catch(function (error) {
                        // handle error
                        console.log(error);
                    });
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });




    }, null, true, 'America/Los_Angeles');
    job.start();

    res.send('OK first');

});

router.get('/metabasecronae', function(req, res, next) {

    var url = req.headers.host;

    var CronJob = require('cron').CronJob;
    //new CronJob('00 00 00 * * *', function() {
    var job = new CronJob('* 10 16 * * *', function() {

        axios.get('http://'+url+'/automation?metaid=1608&spreadsheetid=1u9fpBU-fTCbLbXIMtvK16oVo0RS9doJENLjkjQd2O4w&sheetname=arabclicks')
            .then(function (response) {
                // handle success

                axios.get('http://'+url+'/automation?metaid=1642&spreadsheetid=1u9fpBU-fTCbLbXIMtvK16oVo0RS9doJENLjkjQd2O4w&sheetname=arabyads')
                    .then(function (response) {
                        // handle success

                        axios.get('http://'+url+'/automation?metaid=1651&spreadsheetid=1u9fpBU-fTCbLbXIMtvK16oVo0RS9doJENLjkjQd2O4w&sheetname=armorads')
                            .then(function (response) {
                                // handle success

                                axios.get('http://'+url+'/automation?metaid=1660&spreadsheetid=1u9fpBU-fTCbLbXIMtvK16oVo0RS9doJENLjkjQd2O4w&sheetname=facebook')
                                    .then(function (response) {
                                        // handle success

                                        axios.get('http://'+url+'/automation?metaid=1669&spreadsheetid=1u9fpBU-fTCbLbXIMtvK16oVo0RS9doJENLjkjQd2O4w&sheetname=google')
                                            .then(function (response) {
                                                // handle success

                                                axios.get('http://'+url+'/automation?metaid=1678&spreadsheetid=1u9fpBU-fTCbLbXIMtvK16oVo0RS9doJENLjkjQd2O4w&sheetname=instagram')
                                                    .then(function (response) {
                                                        // handle success

                                                        axios.get('http://'+url+'/automation?metaid=1687&spreadsheetid=1u9fpBU-fTCbLbXIMtvK16oVo0RS9doJENLjkjQd2O4w&sheetname=netaffiliation')
                                                            .then(function (response) {
                                                                // handle success

                                                                axios.get('http://'+url+'/automation?metaid=1696&spreadsheetid=1u9fpBU-fTCbLbXIMtvK16oVo0RS9doJENLjkjQd2O4w&sheetname=voice')
                                                                    .then(function (response) {
                                                                        // handle success

                                                                        axios.get('http://'+url+'/automation?metaid=1705&spreadsheetid=1u9fpBU-fTCbLbXIMtvK16oVo0RS9doJENLjkjQd2O4w&sheetname=wizzo')
                                                                            .then(function (response) {
                                                                                // handle success

                                                                                axios.get('http://'+url+'/automation?metaid=1736&spreadsheetid=1u9fpBU-fTCbLbXIMtvK16oVo0RS9doJENLjkjQd2O4w&sheetname=nosource')
                                                                                    .then(function (response) {
                                                                                        // handle success
                                                                                        console.log("AE LTV - 10 exports ran succesfully at :"+moment().format());
                                                                                    })
                                                                                    .catch(function (error) {
                                                                                        // handle error
                                                                                        console.log(error);
                                                                                    });
                                                                            })
                                                                            .catch(function (error) {
                                                                                // handle error
                                                                                console.log(error);
                                                                            });
                                                                    })
                                                                    .catch(function (error) {
                                                                        // handle error
                                                                        console.log(error);
                                                                    });
                                                            })
                                                            .catch(function (error) {
                                                                // handle error
                                                                console.log(error);
                                                            });
                                                    })
                                                    .catch(function (error) {
                                                        // handle error
                                                        console.log(error);
                                                    });
                                            })
                                            .catch(function (error) {
                                                // handle error
                                                console.log(error);
                                            });

                                    })
                                    .catch(function (error) {
                                        // handle error
                                        console.log(error);
                                    });
                            })
                            .catch(function (error) {
                                // handle error
                                console.log(error);
                            });
                    })
                    .catch(function (error) {
                        // handle error
                        console.log(error);
                    });
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });























    }, null, true, 'America/Los_Angeles');
    job.start();

    res.send('OK first');

});

router.get('/metabasecronbh', function(req, res, next) {

    var url = req.headers.host;

    var CronJob = require('cron').CronJob;
    //new CronJob('00 00 00 * * *', function() {
    var job = new CronJob('* 15 16 * * *', function() {

        axios.get('http://'+url+'/automation?metaid=1609&spreadsheetid=16zBZ5AmmzicG4BJ2brLtWou_Icx8LpM70FlIej_rt90&sheetname=arabclicks')
            .then(function (response) {
                // handle success

                axios.get('http://'+url+'/automation?metaid=1643&spreadsheetid=16zBZ5AmmzicG4BJ2brLtWou_Icx8LpM70FlIej_rt90&sheetname=arabyads')
                    .then(function (response) {
                        // handle success

                        axios.get('http://'+url+'/automation?metaid=1652&spreadsheetid=16zBZ5AmmzicG4BJ2brLtWou_Icx8LpM70FlIej_rt90&sheetname=armorads')
                            .then(function (response) {
                                // handle success

                                axios.get('http://'+url+'/automation?metaid=1661&spreadsheetid=16zBZ5AmmzicG4BJ2brLtWou_Icx8LpM70FlIej_rt90&sheetname=facebook')
                                    .then(function (response) {
                                        // handle success

                                        axios.get('http://'+url+'/automation?metaid=1670&spreadsheetid=16zBZ5AmmzicG4BJ2brLtWou_Icx8LpM70FlIej_rt90&sheetname=google')
                                            .then(function (response) {
                                                // handle success

                                                axios.get('http://'+url+'/automation?metaid=1679&spreadsheetid=16zBZ5AmmzicG4BJ2brLtWou_Icx8LpM70FlIej_rt90&sheetname=instagram')
                                                    .then(function (response) {
                                                        // handle success

                                                        axios.get('http://'+url+'/automation?metaid=1688&spreadsheetid=16zBZ5AmmzicG4BJ2brLtWou_Icx8LpM70FlIej_rt90&sheetname=netaffiliation')
                                                            .then(function (response) {
                                                                // handle success

                                                                axios.get('http://'+url+'/automation?metaid=1697&spreadsheetid=16zBZ5AmmzicG4BJ2brLtWou_Icx8LpM70FlIej_rt90&sheetname=voice')
                                                                    .then(function (response) {
                                                                        // handle success

                                                                        axios.get('http://'+url+'/automation?metaid=1706&spreadsheetid=16zBZ5AmmzicG4BJ2brLtWou_Icx8LpM70FlIej_rt90&sheetname=wizzo')
                                                                            .then(function (response) {
                                                                                // handle success

                                                                                axios.get('http://'+url+'/automation?metaid=1737&spreadsheetid=16zBZ5AmmzicG4BJ2brLtWou_Icx8LpM70FlIej_rt90&sheetname=nosource')
                                                                                    .then(function (response) {
                                                                                        // handle success
                                                                                        console.log("BH LTV - 10 exports ran succesfully at :"+moment().format());
                                                                                    })
                                                                                    .catch(function (error) {
                                                                                        // handle error
                                                                                        console.log(error);
                                                                                    });
                                                                            })
                                                                            .catch(function (error) {
                                                                                // handle error
                                                                                console.log(error);
                                                                            });
                                                                    })
                                                                    .catch(function (error) {
                                                                        // handle error
                                                                        console.log(error);
                                                                    });
                                                            })
                                                            .catch(function (error) {
                                                                // handle error
                                                                console.log(error);
                                                            });
                                                    })
                                                    .catch(function (error) {
                                                        // handle error
                                                        console.log(error);
                                                    });
                                            })
                                            .catch(function (error) {
                                                // handle error
                                                console.log(error);
                                            });

                                    })
                                    .catch(function (error) {
                                        // handle error
                                        console.log(error);
                                    });
                            })
                            .catch(function (error) {
                                // handle error
                                console.log(error);
                            });
                    })
                    .catch(function (error) {
                        // handle error
                        console.log(error);
                    });
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });

    }, null, true, 'America/Los_Angeles');
    job.start();

    res.send('OK first');

});

router.get('/metabasecroniq', function(req, res, next) {

    var url = req.headers.host;

    var CronJob = require('cron').CronJob;
    //new CronJob('00 00 00 * * *', function() {
    var job = new CronJob('* 20 16 * * *', function() {

        axios.get('http://'+url+'/automation?metaid=1640&spreadsheetid=1mtjKsr617kk4HgWeYGDEu4nAu426yac6NUzLSppiteY&sheetname=arabclicks')
            .then(function (response) {
                // handle success

                axios.get('http://'+url+'/automation?metaid=1649&spreadsheetid=1mtjKsr617kk4HgWeYGDEu4nAu426yac6NUzLSppiteY&sheetname=arabyads')
                    .then(function (response) {
                        // handle success

                        axios.get('http://'+url+'/automation?metaid=1658&spreadsheetid=1mtjKsr617kk4HgWeYGDEu4nAu426yac6NUzLSppiteY&sheetname=armorads')
                            .then(function (response) {
                                // handle success

                                axios.get('http://'+url+'/automation?metaid=1667&spreadsheetid=1mtjKsr617kk4HgWeYGDEu4nAu426yac6NUzLSppiteY&sheetname=facebook')
                                    .then(function (response) {
                                        // handle success

                                        axios.get('http://'+url+'/automation?metaid=1676&spreadsheetid=1mtjKsr617kk4HgWeYGDEu4nAu426yac6NUzLSppiteY&sheetname=google')
                                            .then(function (response) {
                                                // handle success

                                                axios.get('http://'+url+'/automation?metaid=1685&spreadsheetid=1mtjKsr617kk4HgWeYGDEu4nAu426yac6NUzLSppiteY&sheetname=instagram')
                                                    .then(function (response) {
                                                        // handle success

                                                        axios.get('http://'+url+'/automation?metaid=1694&spreadsheetid=1mtjKsr617kk4HgWeYGDEu4nAu426yac6NUzLSppiteY&sheetname=netaffiliation')
                                                            .then(function (response) {
                                                                // handle success

                                                                axios.get('http://'+url+'/automation?metaid=1703&spreadsheetid=1mtjKsr617kk4HgWeYGDEu4nAu426yac6NUzLSppiteY&sheetname=voice')
                                                                    .then(function (response) {
                                                                        // handle success

                                                                        axios.get('http://'+url+'/automation?metaid=1712&spreadsheetid=1mtjKsr617kk4HgWeYGDEu4nAu426yac6NUzLSppiteY&sheetname=wizzo')
                                                                            .then(function (response) {
                                                                                // handle success

                                                                                axios.get('http://'+url+'/automation?metaid=1743&spreadsheetid=1mtjKsr617kk4HgWeYGDEu4nAu426yac6NUzLSppiteY&sheetname=nosource')
                                                                                    .then(function (response) {
                                                                                        // handle success
                                                                                        console.log("IQ LTV - 10 exports ran succesfully at :"+moment().format());
                                                                                    })
                                                                                    .catch(function (error) {
                                                                                        // handle error
                                                                                        console.log(error);
                                                                                    });
                                                                            })
                                                                            .catch(function (error) {
                                                                                // handle error
                                                                                console.log(error);
                                                                            });
                                                                    })
                                                                    .catch(function (error) {
                                                                        // handle error
                                                                        console.log(error);
                                                                    });

                                                            })
                                                            .catch(function (error) {
                                                                // handle error
                                                                console.log(error);
                                                            });
                                                    })
                                                    .catch(function (error) {
                                                        // handle error
                                                        console.log(error);
                                                    });
                                            })
                                            .catch(function (error) {
                                                // handle error
                                                console.log(error);
                                            });
                                    })
                                    .catch(function (error) {
                                        // handle error
                                        console.log(error);
                                    });
                            })
                            .catch(function (error) {
                                // handle error
                                console.log(error);
                            });
                    })
                    .catch(function (error) {
                        // handle error
                        console.log(error);
                    });
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });


    }, null, true, 'America/Los_Angeles');
    job.start();

    res.send('OK first');

});

router.get('/metabasecronjo', function(req, res, next) {

    var url = req.headers.host;

    var CronJob = require('cron').CronJob;
    //new CronJob('00 00 00 * * *', function() {
    var job = new CronJob('* 25 16 * * *', function() {

        axios.get('http://'+url+'/automation?metaid=1610&spreadsheetid=13EmU8VUfec-8lC6FpdSFydoJZOsO8JPbSU2YSm5JS04&sheetname=arabclicks')
            .then(function (response) {
                // handle success

                axios.get('http://'+url+'/automation?metaid=1644&spreadsheetid=13EmU8VUfec-8lC6FpdSFydoJZOsO8JPbSU2YSm5JS04&sheetname=arabyads')
                    .then(function (response) {
                        // handle success

                        axios.get('http://'+url+'/automation?metaid=1653&spreadsheetid=13EmU8VUfec-8lC6FpdSFydoJZOsO8JPbSU2YSm5JS04&sheetname=armorads')
                            .then(function (response) {
                                // handle success

                                axios.get('http://'+url+'/automation?metaid=1662&spreadsheetid=13EmU8VUfec-8lC6FpdSFydoJZOsO8JPbSU2YSm5JS04&sheetname=facebook')
                                    .then(function (response) {
                                        // handle success

                                        axios.get('http://'+url+'/automation?metaid=1671&spreadsheetid=13EmU8VUfec-8lC6FpdSFydoJZOsO8JPbSU2YSm5JS04&sheetname=google')
                                            .then(function (response) {
                                                // handle success

                                                axios.get('http://'+url+'/automation?metaid=1680&spreadsheetid=13EmU8VUfec-8lC6FpdSFydoJZOsO8JPbSU2YSm5JS04&sheetname=instagram')
                                                    .then(function (response) {
                                                        // handle success

                                                        axios.get('http://'+url+'/automation?metaid=1689&spreadsheetid=13EmU8VUfec-8lC6FpdSFydoJZOsO8JPbSU2YSm5JS04&sheetname=netaffiliation')
                                                            .then(function (response) {
                                                                // handle success

                                                                axios.get('http://'+url+'/automation?metaid=1698&spreadsheetid=13EmU8VUfec-8lC6FpdSFydoJZOsO8JPbSU2YSm5JS04&sheetname=voice')
                                                                    .then(function (response) {
                                                                        // handle success

                                                                        axios.get('http://'+url+'/automation?metaid=1707&spreadsheetid=13EmU8VUfec-8lC6FpdSFydoJZOsO8JPbSU2YSm5JS04&sheetname=wizzo')
                                                                            .then(function (response) {
                                                                                // handle success

                                                                                axios.get('http://'+url+'/automation?metaid=1738&spreadsheetid=13EmU8VUfec-8lC6FpdSFydoJZOsO8JPbSU2YSm5JS04&sheetname=nosource')
                                                                                    .then(function (response) {
                                                                                        // handle success
                                                                                        console.log("JO LTV - 10 exports ran succesfully at :"+moment().format());
                                                                                    })
                                                                                    .catch(function (error) {
                                                                                        // handle error
                                                                                        console.log(error);
                                                                                    });
                                                                            })
                                                                            .catch(function (error) {
                                                                                // handle error
                                                                                console.log(error);
                                                                            });
                                                                    })
                                                                    .catch(function (error) {
                                                                        // handle error
                                                                        console.log(error);
                                                                    });
                                                            })
                                                            .catch(function (error) {
                                                                // handle error
                                                                console.log(error);
                                                            });
                                                    })
                                                    .catch(function (error) {
                                                        // handle error
                                                        console.log(error);
                                                    });
                                            })
                                            .catch(function (error) {
                                                // handle error
                                                console.log(error);
                                            });
                                    })
                                    .catch(function (error) {
                                        // handle error
                                        console.log(error);
                                    });
                            })
                            .catch(function (error) {
                                // handle error
                                console.log(error);
                            });
                    })
                    .catch(function (error) {
                        // handle error
                        console.log(error);
                    });
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });























    }, null, true, 'America/Los_Angeles');
    job.start();

    res.send('OK first');

});

router.get('/metabasecronkw', function(req, res, next) {

    var url = req.headers.host;

    var CronJob = require('cron').CronJob;
    //new CronJob('00 00 00 * * *', function() {
    var job = new CronJob('* 30 16 * * *', function() {

        axios.get('http://'+url+'/automation?metaid=1613&spreadsheetid=1BrU9az8JTALQ5kOh2nMe-QAPeSyDGyb3ZIcbKoM_Xqg&sheetname=arabclicks')
            .then(function (response) {
                // handle success
                console.log("1");
                axios.get('http://'+url+'/automation?metaid=1647&spreadsheetid=1BrU9az8JTALQ5kOh2nMe-QAPeSyDGyb3ZIcbKoM_Xqg&sheetname=arabyads')
                    .then(function (response) {
                        // handle success
                        console.log("2");
                        axios.get('http://'+url+'/automation?metaid=1656&spreadsheetid=1BrU9az8JTALQ5kOh2nMe-QAPeSyDGyb3ZIcbKoM_Xqg&sheetname=armorads')
                            .then(function (response) {
                                // handle success
                                console.log("3");
                                axios.get('http://'+url+'/automation?metaid=1665&spreadsheetid=1BrU9az8JTALQ5kOh2nMe-QAPeSyDGyb3ZIcbKoM_Xqg&sheetname=facebook')
                                    .then(function (response) {
                                        // handle success
                                        console.log("4");
                                        axios.get('http://'+url+'/automation?metaid=1674&spreadsheetid=1BrU9az8JTALQ5kOh2nMe-QAPeSyDGyb3ZIcbKoM_Xqg&sheetname=google')
                                            .then(function (response) {
                                                // handle success
                                                console.log("5");
                                                axios.get('http://'+url+'/automation?metaid=1683&spreadsheetid=1BrU9az8JTALQ5kOh2nMe-QAPeSyDGyb3ZIcbKoM_Xqg&sheetname=instagram')
                                                    .then(function (response) {
                                                        // handle success
                                                        console.log("6");
                                                        axios.get('http://'+url+'/automation?metaid=1692&spreadsheetid=1BrU9az8JTALQ5kOh2nMe-QAPeSyDGyb3ZIcbKoM_Xqg&sheetname=netaffiliation')
                                                            .then(function (response) {
                                                                // handle success
                                                                console.log("7");
                                                                axios.get('http://'+url+'/automation?metaid=1701&spreadsheetid=1BrU9az8JTALQ5kOh2nMe-QAPeSyDGyb3ZIcbKoM_Xqg&sheetname=voice')
                                                                    .then(function (response) {
                                                                        // handle success
                                                                        console.log("8");
                                                                        axios.get('http://'+url+'/automation?metaid=1710&spreadsheetid=1BrU9az8JTALQ5kOh2nMe-QAPeSyDGyb3ZIcbKoM_Xqg&sheetname=wizzo')
                                                                            .then(function (response) {
                                                                                // handle success
                                                                                console.log("9");
                                                                                axios.get('http://'+url+'/automation?metaid=1741&spreadsheetid=1BrU9az8JTALQ5kOh2nMe-QAPeSyDGyb3ZIcbKoM_Xqg&sheetname=nosource')
                                                                                    .then(function (response) {
                                                                                        // handle success
                                                                                        console.log("KW LTV - 10 exports ran succesfully at :"+moment().format());
                                                                                    })
                                                                                    .catch(function (error) {
                                                                                        // handle error
                                                                                        console.log(error);
                                                                                    });
                                                                            })
                                                                            .catch(function (error) {
                                                                                // handle error
                                                                                console.log(error);
                                                                            });
                                                                    })
                                                                    .catch(function (error) {
                                                                        // handle error
                                                                        console.log(error);
                                                                    });
                                                            })
                                                            .catch(function (error) {
                                                                // handle error
                                                                console.log(error);
                                                            });
                                                    })
                                                    .catch(function (error) {
                                                        // handle error
                                                        console.log(error);
                                                    });
                                            })
                                            .catch(function (error) {
                                                // handle error
                                                console.log(error);
                                            });
                                    })
                                    .catch(function (error) {
                                        // handle error
                                        console.log(error);
                                    });
                            })
                            .catch(function (error) {
                                // handle error
                                console.log(error);
                            });
                    })
                    .catch(function (error) {
                        // handle error
                        console.log(error);
                    });
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });

    }, null, true, 'America/Los_Angeles');
    job.start();

    res.send('OK first');

});

router.get('/metabasecronps', function(req, res, next) {

    var url = req.headers.host;

    var CronJob = require('cron').CronJob;
    //new CronJob('00 00 00 * * *', function() {
    var job = new CronJob('* 35 16 * * *', function() {

        axios.get('http://'+url+'/automation?metaid=1612&spreadsheetid=1uw8q-L3c5FrSHUsxnO2a1uDTf6riAv2mDmDTOV5xI0M&sheetname=arabclicks')
            .then(function (response) {
                // handle success
                console.log("1");
                axios.get('http://'+url+'/automation?metaid=1646&spreadsheetid=1uw8q-L3c5FrSHUsxnO2a1uDTf6riAv2mDmDTOV5xI0M&sheetname=arabyads')
                    .then(function (response) {
                        // handle success
                        console.log("2");
                        axios.get('http://'+url+'/automation?metaid=1655&spreadsheetid=1uw8q-L3c5FrSHUsxnO2a1uDTf6riAv2mDmDTOV5xI0M&sheetname=armorads')
                            .then(function (response) {
                                // handle success
                                console.log("3");
                                axios.get('http://'+url+'/automation?metaid=1664&spreadsheetid=1uw8q-L3c5FrSHUsxnO2a1uDTf6riAv2mDmDTOV5xI0M&sheetname=facebook')
                                    .then(function (response) {
                                        // handle success
                                        console.log("4");
                                        axios.get('http://'+url+'/automation?metaid=1673&spreadsheetid=1uw8q-L3c5FrSHUsxnO2a1uDTf6riAv2mDmDTOV5xI0M&sheetname=google')
                                            .then(function (response) {
                                                // handle success
                                                console.log("5");
                                                axios.get('http://'+url+'/automation?metaid=1682&spreadsheetid=1uw8q-L3c5FrSHUsxnO2a1uDTf6riAv2mDmDTOV5xI0M&sheetname=instagram')
                                                    .then(function (response) {
                                                        // handle success
                                                        console.log("6");
                                                        axios.get('http://'+url+'/automation?metaid=1691&spreadsheetid=1uw8q-L3c5FrSHUsxnO2a1uDTf6riAv2mDmDTOV5xI0M&sheetname=netaffiliation')
                                                            .then(function (response) {
                                                                // handle success
                                                                console.log("7");
                                                                axios.get('http://'+url+'/automation?metaid=1700&spreadsheetid=1uw8q-L3c5FrSHUsxnO2a1uDTf6riAv2mDmDTOV5xI0M&sheetname=voice')
                                                                    .then(function (response) {
                                                                        // handle success
                                                                        console.log("8");
                                                                        axios.get('http://'+url+'/automation?metaid=1709&spreadsheetid=1uw8q-L3c5FrSHUsxnO2a1uDTf6riAv2mDmDTOV5xI0M&sheetname=wizzo')
                                                                            .then(function (response) {
                                                                                // handle success
                                                                                console.log("9");
                                                                                axios.get('http://'+url+'/automation?metaid=1740&spreadsheetid=1uw8q-L3c5FrSHUsxnO2a1uDTf6riAv2mDmDTOV5xI0M&sheetname=nosource')
                                                                                    .then(function (response) {
                                                                                        // handle success
                                                                                        console.log("PS LTV - 10 exports ran succesfully at :"+moment().format());
                                                                                    })
                                                                                    .catch(function (error) {
                                                                                        // handle error
                                                                                        console.log(error);
                                                                                    });
                                                                            })
                                                                            .catch(function (error) {
                                                                                // handle error
                                                                                console.log(error);
                                                                            });
                                                                    })
                                                                    .catch(function (error) {
                                                                        // handle error
                                                                        console.log(error);
                                                                    });
                                                            })
                                                            .catch(function (error) {
                                                                // handle error
                                                                console.log(error);
                                                            });
                                                    })
                                                    .catch(function (error) {
                                                        // handle error
                                                        console.log(error);
                                                    });
                                            })
                                            .catch(function (error) {
                                                // handle error
                                                console.log(error);
                                            });
                                    })
                                    .catch(function (error) {
                                        // handle error
                                        console.log(error);
                                    });
                            })
                            .catch(function (error) {
                                // handle error
                                console.log(error);
                            });
                    })
                    .catch(function (error) {
                        // handle error
                        console.log(error);
                    });
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });



    }, null, true, 'America/Los_Angeles');
    job.start();

    res.send('OK first');

});

router.get('/metabasecronsa', function(req, res, next) {

    var url = req.headers.host;

    var CronJob = require('cron').CronJob;
    //new CronJob('00 00 00 * * *', function() {
    var job = new CronJob('* 40 16 * * *', function() {

        axios.get('http://'+url+'/automation?metaid=1639&spreadsheetid=1a06IlUcIDIO9uncgeX9nrcuqvhvx-FM5IqyrDj4Un28&sheetname=arabclicks')
            .then(function (response) {
                // handle success
                console.log("1");
                axios.get('http://'+url+'/automation?metaid=1648&spreadsheetid=1a06IlUcIDIO9uncgeX9nrcuqvhvx-FM5IqyrDj4Un28&sheetname=arabyads')
                    .then(function (response) {
                        // handle success
                        console.log("2");
                        axios.get('http://'+url+'/automation?metaid=1657&spreadsheetid=1a06IlUcIDIO9uncgeX9nrcuqvhvx-FM5IqyrDj4Un28&sheetname=armorads')
                            .then(function (response) {
                                // handle success
                                console.log("3");
                                axios.get('http://'+url+'/automation?metaid=1666&spreadsheetid=1a06IlUcIDIO9uncgeX9nrcuqvhvx-FM5IqyrDj4Un28&sheetname=facebook')
                                    .then(function (response) {
                                        // handle success
                                        console.log("4");
                                        axios.get('http://'+url+'/automation?metaid=1675&spreadsheetid=1a06IlUcIDIO9uncgeX9nrcuqvhvx-FM5IqyrDj4Un28&sheetname=google')
                                            .then(function (response) {
                                                // handle success
                                                console.log("5");
                                                axios.get('http://'+url+'/automation?metaid=1684&spreadsheetid=1a06IlUcIDIO9uncgeX9nrcuqvhvx-FM5IqyrDj4Un28&sheetname=instagram')
                                                    .then(function (response) {
                                                        // handle success
                                                        console.log("6");
                                                        axios.get('http://'+url+'/automation?metaid=1693&spreadsheetid=1a06IlUcIDIO9uncgeX9nrcuqvhvx-FM5IqyrDj4Un28&sheetname=netaffiliation')
                                                            .then(function (response) {
                                                                // handle success
                                                                console.log("7");
                                                                axios.get('http://'+url+'/automation?metaid=1702&spreadsheetid=1a06IlUcIDIO9uncgeX9nrcuqvhvx-FM5IqyrDj4Un28&sheetname=voice')
                                                                    .then(function (response) {
                                                                        // handle success
                                                                        console.log("8");
                                                                        axios.get('http://'+url+'/automation?metaid=1711&spreadsheetid=1a06IlUcIDIO9uncgeX9nrcuqvhvx-FM5IqyrDj4Un28&sheetname=wizzo')
                                                                            .then(function (response) {
                                                                                // handle success
                                                                                console.log("9");
                                                                                axios.get('http://'+url+'/automation?metaid=1742&spreadsheetid=1a06IlUcIDIO9uncgeX9nrcuqvhvx-FM5IqyrDj4Un28&sheetname=nosource')
                                                                                    .then(function (response) {
                                                                                        // handle success
                                                                                        console.log("SA LTV - 10 exports ran succesfully at :"+moment().format());
                                                                                    })
                                                                                    .catch(function (error) {
                                                                                        // handle error
                                                                                        console.log(error);
                                                                                    });

                                                                            })
                                                                            .catch(function (error) {
                                                                                // handle error
                                                                                console.log(error);
                                                                            });
                                                                    })
                                                                    .catch(function (error) {
                                                                        // handle error
                                                                        console.log(error);
                                                                    });
                                                            })
                                                            .catch(function (error) {
                                                                // handle error
                                                                console.log(error);
                                                            });
                                                    })
                                                    .catch(function (error) {
                                                        // handle error
                                                        console.log(error);
                                                    });
                                            })
                                            .catch(function (error) {
                                                // handle error
                                                console.log(error);
                                            });
                                    })
                                    .catch(function (error) {
                                        // handle error
                                        console.log(error);
                                    });

                            })
                            .catch(function (error) {
                                // handle error
                                console.log(error);
                            });
                    })
                    .catch(function (error) {
                        // handle error
                        console.log(error);
                    });
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });

    }, null, true, 'America/Los_Angeles');
    job.start();

    res.send('OK first');

});

router.get('/metabasecrontn', function(req, res, next) {

    var url = req.headers.host;

    var CronJob = require('cron').CronJob;
    //new CronJob('00 00 00 * * *', function() {
    var job = new CronJob('* 45 16 * * *', function() {

        axios.get('http://'+url+'/automation?metaid=1611&spreadsheetid=18P3ULTE1w6ExiDvysF6Lk1DPnlFfZNRqB0Iglvst6g8&sheetname=arabclicks')
            .then(function (response) {
                // handle success

                axios.get('http://'+url+'/automation?metaid=1645&spreadsheetid=18P3ULTE1w6ExiDvysF6Lk1DPnlFfZNRqB0Iglvst6g8&sheetname=arabyads')
                    .then(function (response) {
                        // handle success
                        console.log("1");
                        axios.get('http://'+url+'/automation?metaid=1645&spreadsheetid=18P3ULTE1w6ExiDvysF6Lk1DPnlFfZNRqB0Iglvst6g8&sheetname=arabyads')
                            .then(function (response) {
                                // handle success
                                console.log("2");
                                axios.get('http://'+url+'/automation?metaid=1654&spreadsheetid=18P3ULTE1w6ExiDvysF6Lk1DPnlFfZNRqB0Iglvst6g8&sheetname=armorads')
                                    .then(function (response) {
                                        // handle success
                                        console.log("3");
                                        axios.get('http://'+url+'/automation?metaid=1663&spreadsheetid=18P3ULTE1w6ExiDvysF6Lk1DPnlFfZNRqB0Iglvst6g8&sheetname=facebook')
                                            .then(function (response) {
                                                // handle success
                                                console.log("4");
                                                axios.get('http://'+url+'/automation?metaid=1672&spreadsheetid=18P3ULTE1w6ExiDvysF6Lk1DPnlFfZNRqB0Iglvst6g8&sheetname=google')
                                                    .then(function (response) {
                                                        // handle success
                                                        console.log("5");
                                                        axios.get('http://'+url+'/automation?metaid=1681&spreadsheetid=18P3ULTE1w6ExiDvysF6Lk1DPnlFfZNRqB0Iglvst6g8&sheetname=instagram')
                                                            .then(function (response) {
                                                                // handle success
                                                                console.log("6");
                                                                axios.get('http://'+url+'/automation?metaid=1690&spreadsheetid=18P3ULTE1w6ExiDvysF6Lk1DPnlFfZNRqB0Iglvst6g8&sheetname=netaffiliation')
                                                                    .then(function (response) {
                                                                        // handle success
                                                                        console.log("7");
                                                                        axios.get('http://'+url+'/automation?metaid=1699&spreadsheetid=18P3ULTE1w6ExiDvysF6Lk1DPnlFfZNRqB0Iglvst6g8&sheetname=voice')
                                                                            .then(function (response) {
                                                                                // handle success
                                                                                console.log("8");
                                                                                axios.get('http://'+url+'/automation?metaid=1708&spreadsheetid=18P3ULTE1w6ExiDvysF6Lk1DPnlFfZNRqB0Iglvst6g8&sheetname=wizzo')
                                                                                    .then(function (response) {
                                                                                        // handle success
                                                                                        console.log("9");
                                                                                        axios.get('http://'+url+'/automation?metaid=1739&spreadsheetid=18P3ULTE1w6ExiDvysF6Lk1DPnlFfZNRqB0Iglvst6g8&sheetname=nosource')
                                                                                            .then(function (response) {
                                                                                                // handle success
                                                                                                console.log("TN LTV - 10 exports ran succesfully at :"+moment().format());
                                                                                            })
                                                                                            .catch(function (error) {
                                                                                                // handle error
                                                                                                console.log(error);
                                                                                                res.send('ERROR');                                                                                            });
                                                                                    })
                                                                                    .catch(function (error) {
                                                                                        // handle error
                                                                                        console.log(error);
                                                                                        res.send('ERROR');
                                                                                    });
                                                                            })
                                                                            .catch(function (error) {
                                                                                // handle error
                                                                                console.log(error);
                                                                                res.send('ERROR');
                                                                            });
                                                                    })
                                                                    .catch(function (error) {
                                                                        // handle error
                                                                        console.log(error);
                                                                        res.send('ERROR');
                                                                    });
                                                            })
                                                            .catch(function (error) {
                                                                // handle error
                                                                console.log(error);
                                                                res.send('ERROR');
                                                            });
                                                    })
                                                    .catch(function (error) {
                                                        // handle error
                                                        console.log(error);
                                                        res.send('ERROR');
                                                    });
                                            })
                                            .catch(function (error) {
                                                // handle error
                                                console.log(error);
                                                res.send('ERROR');
                                            });
                                    })
                                    .catch(function (error) {
                                        // handle error
                                        console.log(error);
                                        res.send('ERROR');
                                    });
                            })
                            .catch(function (error) {
                                // handle error
                                console.log(error);
                                res.send('ERROR');
                            });
                    })
                    .catch(function (error) {
                        // handle error
                        res.send('ERROR');
                        console.log(error);
                    });
            })
            .catch(function (error) {
                // handle error
                console.log(error);
                res.send('ERROR');
            });

    }, null, true, 'America/Los_Angeles');
    job.start();

    res.send('OK first');

});


module.exports = router;
