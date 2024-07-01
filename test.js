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

function authenticateDN(username, password) {
  return new Promise((resolve, reject) => {
    client.bind(username, password, (err) => {
      if (err) {
        console.log("Error en la conexión: " + err);
        reject(err);
      } else {
        console.log("Conexión exitosa");
        resolve();
      }
    });
  });
}

app.get("/buscar", async (req, res) => {
  const user = req.query.usuario;
  console.log("buscar: " + user);

  try {
    // Autenticación antes de buscar
    await authenticateDN(process.env.CN, process.env.PASSWORD);

    var options = {
      filter: `(sAMAccountName=${user})`, // Filtro de búsqueda
      scope: "sub", // Alcance de la búsqueda
      attributes: ["dn", "givenName"], // Atributos a recuperar
    };

    // Realizar la búsqueda
    client.search("DC=vinte,DC=com", options, (err, searchRes) => {
      if (err) {
        console.log("Error en la búsqueda: " + err);
        return res.status(500).send("Error en la búsqueda");
      }

      let entries = [];
      searchRes.on("searchEntry", (entry) => {
        // Imprimir el objeto completo para depuración
        console.log("searchEntry: ", JSON.stringify(entry, null, 2));

        // Ver si entry tiene la propiedad `object` o explorar otras propiedades
        if (entry.object) {
          entries.push(entry.object);
        } else {
          // Prueba imprimir diferentes partes de `entry`
          console.log("DN: ", entry.dn);
          console.log("Atributos: ", entry.attributes);
          // Agregar los datos al array de resultados de una forma más completa
          entries.push({
            dn: entry.dn,
            attributes: entry.attributes,
          });
        }
      });

      searchRes.on("end", (result) => {
        if (result.status !== 0) {
          console.log("Búsqueda finalizada con errores: " + result.status);
          return res.status(500).send("Error en la búsqueda");
        }
        res.json(entries); // Enviar los resultados como respuesta
      });

      searchRes.on("error", (err) => {
        console.log("Error en la búsqueda: " + err);
        res.status(500).send("Error en la búsqueda");
      });
    });
  } catch (err) {
    res.status(400).json({
      result: {
        error: 1,
        message: "Conexión a servidor LDAP fallida",
      },
    });
  }
});

