var express = require('express');
require('dotenv').config();
var app = express();
var ldap = require('ldapjs');

app.listen(3000, function () {
    console.log("server started")
})

/*update the url according to your ldap address*/
var client = ldap.createClient({
    url: 'ldap://10.10.0.55:389'
});

/*use this to create connection*/
function authenticateDN(username, password) {

    /*bind use for authentication*/
    client.bind(username, password, function (err) {
        if (err) {
            console.log("Error in new connetion " + err)
        } else {
            /*if connection is success then go for any operation*/
            console.log("Success");
            searchUser();            
            //modifyDN('cn=bar,ou=users,ou=system');

        }
    });
}

/*use this to search user, add your condition inside filter*/
function searchUser() {
    var opts = {        
        filter: '(|(uid=2)(sn=John)(cn=Smith))', // or search
        scope: 'sub',
        attributes: ['sn']
    };

    client.search('ou=users,ou=system', opts, function (err, res) {
        if (err) {
            console.log("Error in search " + err)
        } else {
            res.on('searchEntry', function (entry) {
                console.log('entry: ' + JSON.stringify(entry.object));
            });
            res.on('searchReference', function (referral) {
                console.log('referral: ' + referral.uris.join());
            });
            res.on('error', function (err) {
                console.error('error: ' + err.message);
            });
            res.on('end', function (result) {
                console.log('status: ' + result.status);
            });
        }
    });
}




/*create authentication*/
authenticateDN(process.env.CN, process.env.PASSWORD)