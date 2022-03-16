var express = require('express');
var router = express.Router();
const axios = require('axios');
const { getGeocode } = require('../models/SalesOrder');
const { assertNotNull } = require('../common/helpers');

router.get('/publicHolidays', async function(req, res, next) {
    
    let data = {
        resource_id: '04a78f5b-2d12-4695-a6cd-d2b072bc93fe' // Year 2022
    }

    axios.get('https://data.gov.sg/api/action/datastore_search', { params: data })
        .then(results => results.data)
        .then(results => res.send(results.result))
        .catch(err => res.status(500).send(err))

});

router.get('/geocode', async function(req, res, next) {
    const { postal_code } = req.query;

    if (postal_code == null) {
        res.status(400).send(`'postal_code' is required.`);
        return;
    }
    
    try {
        const results = await getGeocode(postal_code);

        res.send(results);

    } catch(err) {
        // Throws error if postal code not found
        res.status(400).send(err);
        return;
    }

});

router.post('/optimizeRoutes', async function(req, res, next) {
    const { 
        origin,     // { longitude: number, latitude: number }
        waypoints,  // { longitude: number, latitude: number }[]
    } = req.body;

    try {
        assertNotNull(req.body, ['origin', 'waypoints']);
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
    
        let params = {
            origin: `${origin.latitude},${origin.longitude}`,
            destination: `${origin.latitude},${origin.longitude}`,
            waypoints: `optimize:true${waypoints.map(x => `|${x.latitude},${x.longitude}`)}`,
            key: process.env.GOOGLE_API_KEY,
        }

        const { data } = await axios.get('https://maps.googleapis.com/maps/api/directions/json', { params: params })

        if (data.routes.length === 0) {
            res.status(400).send('Unable to find an optimized route.');
            return;
        }

        res.send(data.routes[0]);

    } catch(err) {
        // Throws error if postal code not found
        res.status(500).send(err);
        return;
    }

});

module.exports = router;