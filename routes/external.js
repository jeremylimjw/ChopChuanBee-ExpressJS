var express = require('express');
var router = express.Router();
const axios = require('axios');

router.get('/publicHolidays', async function(req, res, next) {
    
    let data = {
        resource_id: '04a78f5b-2d12-4695-a6cd-d2b072bc93fe' // Year 2022
    }

    axios.get('https://data.gov.sg/api/action/datastore_search', { params: data })
        .then(results => results.data)
        .then(results => res.send(results.result))
        .catch(err => res.status(500).send(err))

});

module.exports = router;