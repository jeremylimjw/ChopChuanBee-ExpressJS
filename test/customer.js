const assert = require('assert');
const { loginAsAdmin } = require('.');

describe('/customer', () => {

    let http;
    let newCustomer;
    let newProduct;

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
                description : "Software Application Platforms" 
            }
            const { data: postData } = await http.post(`/customer`, customer);

            // Retrieve customer
            const { data: getData } = await http.get(`/customer?id=${postData.id}`);

            // Assert changes
            assert.notEqual(getData[0], 0);
            newCustomer = getData[0];

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
            assert.notEqual(getData.length, 0);

            // Assert changes
            assert.equal(getData[0].p2_name, "Jane Doe");
            assert.equal(getData[0].p2_phone_number, "99998888");

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    });

    it('PUT /menu (add)', async () => {
        try {
            // Create product
            let product = { 
                name: "Customer ketchup", 
                unit: "bottles", 
                min_inventory_level: 100
            }
            let postData = await http.post(`/product`, product);
            newProduct = postData.data;

            // Update menu
            await http.put(`/customer/menu`, {
                customer_id: newCustomer.id,
                customer_menus: [
                    {
                        customer_id: newCustomer.id,
                        product_alias: "Test",
                        product_id: newProduct.id,
                    }
                ]
            });

            // Retrieve menu
            const { data: getData } = await http.get(`/customer/menu?customer_id=${newCustomer.id}`);
            assert.notEqual(getData.length, 0);

            // Assert changes
            assert.equal(getData[0].product_alias, "Test");
            assert.equal(getData[0].product_id, newProduct.id);

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    });

    it('PUT /menu (delete)', async () => {
        try {
            // Update menu
            await http.put(`/customer/menu`, {
                customer_id: newCustomer.id,
                customer_menus: []
            });

            // Retrieve menu
            const { data: getData } = await http.get(`/customer/menu?customer_id=${newCustomer.id}`);
            assert.equal(getData.length, 0);

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    });

    it('POST /deactivate', async () => {
        try {
            // Delete customer
            await http.post(`/customer/deactivate`, { id: newCustomer.id });

            // Retrieve customer
            const { data: getData } = await http.get(`/customer?id=${newCustomer.id}`);

            // Assert changes
            assert.notEqual(getData[0].deactivated_date, null);

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    });

    it('POST /activate', async () => {
        try {
            // Delete customer
            await http.post(`/customer/activate`, { id: newCustomer.id });

            // Retrieve customer
            const { data: getData } = await http.get(`/customer?id=${newCustomer.id}`);

            // Assert changes
            assert.equal(getData[0].deactivated_date, null);

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