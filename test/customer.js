const assert = require('assert');
const { loginAsAdmin } = require('.');

describe('/customer', () => {

    let http;
    let newCustomer;

    it('POST /', async () => {
        try {
            // Login
            http = await loginAsAdmin();

            // Create customer
            let customer = { 
                company_name : "SAP", company_email : "sap@gmail.com", 
                p1_name : "John Doe", p1_phone_number : "98727674", 
                p2_name : null, p2_phone_number : null, 
                address : "21 Jump Street", postal_code : "472648", 
                charged_under_id: 1, gst : true, 
                gst_show : true, description : "Software Application Platforms" 
            }
            const { data: postData } = await http.post(`/customer`, customer);

            // Retrieve customer
            const { data: getData } = await http.get(`/customer?id=${postData.id}`);

            // Assert changes
            assert.notEqual(getData, null);
            newCustomer = getData;

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    })

    it('UPDATE /', async () => {
        try {
            // Update customer
            const modifyCustomer = {...newCustomer, p2_name: "Jane Doe", p2_phone_number: "99998888" };
            const { data: putData } = await http.put(`/customer`, modifyCustomer);

            // Retrieve customer
            const { data: getData } = await http.get(`/customer?id=${newCustomer.id}`);
            assert.notEqual(getData, null);

            // Assert changes
            assert.equal(getData.p2_name, "Jane Doe");
            assert.equal(getData.p2_phone_number, "99998888");

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    });

    it('DELETE /', async () => {
        try {
            // Delete customer
            await http.delete(`/customer?id=${newCustomer.id}`);

            // Retrieve customer
            const { data: getData } = await http.get(`/customer?id=${newCustomer.id}`);

            // Assert changes
            assert.equal(getData.deleted, true);

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    });

    it('GET /', async () => {
        try {
            // Retrieve customer
            const { data: getData } = await http.get(`/customer`);

            // Assert changes
            assert.notEqual(getData.length, 0);

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    });

})