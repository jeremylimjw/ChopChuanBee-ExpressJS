const assert = require('assert');
const { loginAsAdmin, login } = require('.');

describe('/employee', () => {

    let http;
    let newEmployee;
    let newPassword = "password";

    it('POST /', async () => {
        try {
            // Login as Admin
            http = await loginAsAdmin();

            // Create Employee
            let employee = { 
                name: "Kenny McCormick", 
                username: Math.random().toString(), // because of unique constraint
                email: Math.random().toString(), 
                role_id: 2, 
                contact_number: "84726782", 
                nok_name: "Matthew McCaughnohaugh", 
                nok_number: "82747282", 
                address: "21 Old Airport Rd", 
                postal_code: "624902", 
                send_email: false,
                access_rights: [
                    {
                        view_id: 1,
                        has_write_access: true,
                    },
                ]
            }
            const { data: postData } = await http.post(`/employee`, employee);
            newEmployee = postData;

            // Retrieve employee
            const { data: getData } = await http.get(`/employee?id=${postData.id}`);

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
    })

    it('UPDATE /', async () => {
        try {
            // Update employee
            const modifyEmployee = {...newEmployee, address: "Kent Ridge Hall", postal_code: "123456" };

            await http.put(`/employee`, modifyEmployee);

            // Retrieve employee
            const { data: getData } = await http.get(`/employee?id=${newEmployee.id}`);
            assert.notEqual(getData.length, 0);

            // Assert changes
            assert.equal(getData[0].address, "Kent Ridge Hall");
            assert.equal(getData[0].postal_code, "123456");

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
            // Retrieve employee
            const { data: getData } = await http.get(`/employee`);

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

    it('PUT /accessRight', async () => {
        try {
            // Create AccessRights
            let accessRights = { 
                id: newEmployee.id, 
                access_rights: [
                    { view_id: 1, has_write_access: true },
                ]
            }
            await http.put(`/employee/accessRight`, accessRights);

            // Retrieve employee
            const { data: getData1 } = await http.get(`/employee?id=${newEmployee.id}`);

            // Assert changes
            assert.equal(getData1[0].access_rights.length, 1);
            assert.equal(getData1[0].access_rights[0].view_id, 1);
            assert.equal(getData1[0].access_rights[0].has_write_access, true);

            accessRights = { 
                id: newEmployee.id, 
                access_rights: [
                    { view_id: 1, has_write_access: false },
                ]
            }
            await http.put(`/employee/accessRight`, accessRights);

            // Retrieve employee
            const { data: getData2 } = await http.get(`/employee?id=${newEmployee.id}`);

            // Assert changes
            assert.equal(getData2[0].access_rights.length, 1);
            assert.equal(getData2[0].access_rights[0].view_id, 1);
            assert.equal(getData2[0].access_rights[0].has_write_access, false);

            accessRights = { 
                id: newEmployee.id, 
                access_rights: []
            }
            await http.put(`/employee/accessRight`, accessRights);

            // Retrieve employee
            const { data: getData3 } = await http.get(`/employee?id=${newEmployee.id}`);

            // Assert changes
            assert.equal(getData3[0].access_rights.length, 0);

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    })

    it('UPDATE /profile', async () => {
        try {
            // Update employee
            const modifyEmployee = {...newEmployee, address: "Yusof Ishak House", postal_code: "987654" };

            await http.put(`/employee/profile`, modifyEmployee);

            // Retrieve employee
            const { data: getData } = await http.get(`/employee?id=${newEmployee.id}`);
            assert.notEqual(getData.length, 0);

            // Assert changes
            assert.equal(getData[0].address, "Yusof Ishak House");
            assert.equal(getData[0].postal_code, "987654");

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    });

    it('POST /changePassword', async () => {
        try {
            // Login as the new employee
            http = await login(newEmployee.username, newEmployee.password);

            // Change password
            await http.post(`/employee/changePassword`, { old_password: newEmployee.password, new_password: newPassword });

            // Login again with the new password
            http = await login(newEmployee.username, newPassword);

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
            // Login as Admin
            http = await loginAsAdmin();

            // Update employee
            await http.post(`/employee/deactivate`, newEmployee);

            // Retrieve employee
            const { data: getData } = await http.get(`/employee?id=${newEmployee.id}`);

            // Assert changes
            assert.notEqual(getData[0].discharge_date, null);

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }

        // Cannot login anymore
        try {
            http = await login(newEmployee.username, newPassword);
        } catch(err) { 
            assert.equal(err.response.data, "This account has been deactivated.");
        }
    });

    it('POST /activate', async () => {
        try {
            // Login as Admin
            http = await loginAsAdmin();

            // Update employee
            await http.post(`/employee/activate`, newEmployee);

            // Retrieve employee
            const { data: getData } = await http.get(`/employee?id=${newEmployee.id}`);

            // Assert changes
            assert.equal(getData[0].discharge_date, null);

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }

        // Can login again
        await login(newEmployee.username, newPassword);
    });

})