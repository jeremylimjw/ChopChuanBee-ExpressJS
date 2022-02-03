const assert = require('assert');
const { loginAsAdmin } = require('.');

describe('/product', () => {

    let http;
    let newProduct;

    it('POST /', async () => {
        try {
            // Login
            http = await loginAsAdmin();

            // Create product
            let product = { 
                name: "Maggi ketchup", 
                description: "Best ketchup ever", 
                unit: "bottles", 
                min_inventory_level: 100
            }
            const { data: postData } = await http.post(`/product`, product);

            // Retrieve customer
            const { data: getData } = await http.get(`/product?id=${postData.id}`);

            // Assert changes
            assert.notEqual(getData, null);
            newProduct = getData;

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
            // Update product
            const modifyProduct = {...newProduct, min_inventory_level: 150 };
            const { data: putData } = await http.put(`/product`, modifyProduct);

            // Retrieve product
            const { data: getData } = await http.get(`/product?id=${newProduct.id}`);
            assert.notEqual(getData, null);

            // Assert changes
            assert.equal(getData.min_inventory_level, 150);

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
            // Delete product
            await http.delete(`/product?id=${newProduct.id}`);

            // Retrieve product
            const { data: getData } = await http.get(`/product?id=${newProduct.id}`);

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
            // Retrieve product
            const { data: getData } = await http.get(`/product`);

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