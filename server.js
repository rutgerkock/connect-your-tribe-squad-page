// Importeer het npm pakket express uit de node_modules map
import express from 'express'

// Importeer de zelfgemaakte functie fetchJson uit de ./helpers map
import fetchJson from './helpers/fetch-json.js'

// Stel het basis endpoint in
const apiUrl = 'https://fdnd.directus.app/items'

// Haal alle squads uit de WHOIS API op
const squadData = await fetchJson(apiUrl + '/squad')
const personData = await fetchJson(apiUrl + '/person')

// Maak een nieuwe express app aan
const app = express()

// Stel ejs in als template engine
app.set('view engine', 'ejs')

// Stel de map met ejs templates in
app.set('views', './views')

// Gebruik de map 'public' voor statische resources, zoals stylesheets, afbeeldingen en client-side JavaScript
app.use(express.static('public'))


app.get('/', function (request, response) {
  // Haal alle personen uit de WHOIS API op
  fetchJson(apiUrl + '/person').then((apiData) => {
    // apiData bevat gegevens van alle personen uit alle squads
    // Je zou dat hier kunnen filteren, sorteren, of zelfs aanpassen, voordat je het doorgeeft aan de view

    // Render index.ejs uit de views map en geef de opgehaalde data mee als variabele, genaamd persons
    response.render('index', { persons: apiData.data, squads: squadData.data, person: personData.data})
  })
})

app.get('/squad/:id', async function (request, response) {
  try {
    const squadId = request.params.id;
    const sort = request.query.sort;

    const squadData = await fetchJson(apiUrl + '/squad/' + squadId);

    let personDataUrl = apiUrl + '/person?filter={"squad_id":' + squadId + '}';
    if (sort) {
      personDataUrl += `&sort=${sort}`;
    }

    const personData = await fetchJson(personDataUrl);

    response.render('squad', { persons: personData.data, squad: squadData.data });
  } catch (error) {
    console.error('Error:', error);
    response.status(500).send('Internal Server Error');
  }
});


// Maak een POST route voor de index
app.post('/', function (request, response) {
  // Er is nog geen afhandeling van POST, redirect naar GET op /
  response.redirect(303, '/')
})

// Maak een GET route voor een detailpagina met een request parameter id
app.get('/person/:id', function (request, response) {
  // Gebruik de request parameter id en haal de juiste persoon uit de WHOIS API op
  fetchJson(apiUrl + '/person/' + request.params.id).then((apiData) => {
    // Render person.ejs uit de views map en geef de opgehaalde data mee als variable, genaamd person
    response.render('person', {person: apiData.data, squads: squadData.data})
  })
})


app.get('/search', function (request, response) {
  const searchData = request.query.search.toLowerCase();
  fetchJson(apiUrl + '/person').then((apiData) => {
    const filteredPersons = apiData.data.filter(person => {
      return person.name.toLowerCase().includes(searchData) || person.surname.toLowerCase().includes(searchData);
    });

    if (searchData === '') {
      return response.send(`<script>alert("Je kan niet zoeken naar niks!"); window.location.href = "/";</script>`);
    } else if (filteredPersons.length === 0) {
      return response.send(`<script>alert("Er zit niemand met '${searchData}' in de naam in squad D, E of F."); window.location.href = "/";</script>`);
    } else {
      response.render('search', { 
        person: apiData.data,
        persons: filteredPersons, 
        search: searchData
      });
    }
  }).catch(error => {
    console.error('Error:', error);
    response.status(500).send('Internal Server Error');
  });
});



// Stel het poortnummer in waar express op moet gaan luisteren
app.set('port', process.env.PORT || 8000)

// Start express op, haal daarbij het zojuist ingestelde poortnummer op
app.listen(app.get('port'), function () {
  // Toon een bericht in de console en geef het poortnummer door
  console.log(`Application started on http://localhost:${app.get('port')}`)
})