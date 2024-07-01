var express = require("express");
require("dotenv").config();
var app = express();
var ldap = require("ldapjs");

app.listen(3000, function () {
  console.log("server started");
});

var client = ldap.createClient({
  url: "ldap://10.10.0.55:389",
});

function authenticateDN(username, password, callback) {
  client.bind(username, password, (err) => {
    if (err) {
      console.log("Error en la conexión: " + err);
      callback(err);
    } else {
      console.log("Conexión exitosa");
      callback(null);
    }
  });
}

app.get("/buscar", (req, res) => {
  const user = req.query.usuario;
  console.log("buscar: " + user);
  authenticateDN(process.env.CN, process.env.PASSWORD, (err) => {
    if (err) {
      res.status(400).json({
        result: {
          error: 1,
          message: "Conexión a servidor LDAP fallida",
        },
      });
      return;
    }
  });

  var options = {
    filter: `(sAMAccountName=${user})`, // Filtro de búsqueda
    scope: "sub", // Alcance de la búsqueda
    attributes: [
      "dn",
      "st",
      "l",
      "givenName",
      "sn",
      "cn",
      "displayName",
      "mail",
      "telephoneNumber",
      "title",
      "department",
      "company",
      "memberOf",
      "lastLogonTimestamp",
    ],
  };

  client.search("DC=vinte,DC=com", options, (err, searchRes) => {
    if (err) {
      console.log("Error en la búsqueda: " + err);
      return res.status(500).send("Error en la búsqueda");
    }

    searchRes.on("searchRequest", (searchRequest) => {
      console.log("searchRequest: ", searchRequest.messageId);
    });

    let entries = [];
    searchRes.on("searchEntry", (entry) => {
      // Acceder al DN
      let dn = entry.dn.toString();
      let attributes = {};
      entry.attributes.forEach((attribute) => {
        //console.log(attribute.type + ": " + attribute.values);
        attributes[attribute.type] = attribute.values
          ? attribute.values[0]
          : "";
      });
      // Member Of

      entries.push({
        dn: dn,
        attributes: attributes,
      });
    });

    searchRes.on("end", (result) => {
      if (result.status !== 0) {
        return res.status(500).send("Error en la búsqueda");
      }
      res.json(entries); // Enviar los resultados como respuesta
    });

    searchRes.on("error", (err) => {
      res.status(500).send("Error en la búsqueda");
    });
  });
});
