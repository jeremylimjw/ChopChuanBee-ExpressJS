const assert = require('assert');
const { loginAsAdmin } = require('.');

describe('/supplier', () => {

    let http;
    let newSupplier;
    let newProduct;

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
            assert.notEqual(getData.length, 0);
            newSupplier = getData[0];

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
            assert.notEqual(getData.length, 0);

            // Assert changes
            assert.equal(getData[0].s1_name, "Cheng Lim");
            assert.equal(getData[0].s1_phone_number, "11113333");

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
                name: "Supplier ketchup", 
                unit: "bottles", 
                min_inventory_level: 100
            }
            let postData = await http.post(`/product`, product);
            newProduct = postData.data;

            // Update menu
            await http.put(`/supplier/menu`, {
                supplier_id: newSupplier.id,
                supplier_menus: [
                    {
                        supplier_id: newSupplier.id,
                        product_id: newProduct.id,
                    }
                ]
            });

            // Retrieve menu
            const { data: getData } = await http.get(`/supplier/menu?supplier_id=${newSupplier.id}`);
            assert.notEqual(getData.length, 0);

            // Assert changes
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
            await http.put(`/supplier/menu`, {
                supplier_id: newSupplier.id,
                supplier_menus: []
            });

            // Retrieve menu
            const { data: getData } = await http.get(`/supplier/menu?supplier_id=${newSupplier.id}`);
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
            // Deactivate supplier
            await http.post(`/supplier/deactivate`, { id: newSupplier.id });

            // Retrieve supplier
            const { data: getData } = await http.get(`/supplier?id=${newSupplier.id}`);

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
            // Activate supplier
            await http.post(`/supplier/activate`, { id: newSupplier.id });

            // Retrieve supplier
            const { data: getData } = await http.get(`/supplier?id=${newSupplier.id}`);

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