const assert = require('assert');
const { loginAsAdmin } = require('.');

describe('/supplier', () => {

    let http;
    let newSupplier;

    it('POST /', async () => {
        try {
            // Login
            http = await loginAsAdmin();

            // Create product
            let supplier = { 
                company_name: "Cheng Bee",
                s1_name: "Ah Cheng", 
                s1_phone_number: "82724782", 
                address: "21 Sim Lim Rd", 
                postal_code: "523232", 
                description: "", 
                company_email: "chengbee@gmail.com",
                s2_name: "", 
                s2_phone_number: ""
            }
            const { data: postData } = await http.post(`/supplier`, supplier);

            // Retrieve customer
            const { data: getData } = await http.get(`/supplier?id=${postData.id}`);

            // Assert changes
            assert.notEqual(getData, null);
            newSupplier = getData;

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
            // Update supplier
            const modifySupplier = {...newSupplier, s1_name: "Cheng Lim", s1_phone_number: "11113333" };
            await http.put(`/supplier`, modifySupplier);

            // Retrieve product
            const { data: getData } = await http.get(`/supplier?id=${newSupplier.id}`);
            assert.notEqual(getData, null);

            // Assert changes
            assert.equal(getData.s1_name, "Cheng Lim");
            assert.equal(getData.s1_phone_number, "11113333");

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
            // Delete supplier
            await http.delete(`/supplier?id=${newSupplier.id}`);

            // Retrieve supplier
            const { data: getData } = await http.get(`/supplier?id=${newSupplier.id}`);

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
            // Retrieve supplier
            const { data: getData } = await http.get(`/supplier`);

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