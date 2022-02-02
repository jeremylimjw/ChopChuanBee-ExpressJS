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
                username: "kenny", 
                email: "nuschopchuanbee@gmail.com", 
                role_id: 2, 
                contact_number: "84726782", 
                nok_name: "Matthew McCaughnohaugh", 
                nok_number: "82747282", 
                address: "21 Old Airport Rd", 
                postal_code: "624902", 
                send_email: false
            }
            const { data: postData } = await http.post(`/employee`, employee);
            newEmployee = postData;

            // Retrieve employee
            const { data: getData } = await http.get(`/employee?id=${postData.id}`);

            // Assert changes
            assert.notEqual(getData, null);

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
            assert.notEqual(getData, null);

            // Assert changes
            assert.equal(getData.address, "Kent Ridge Hall");
            assert.equal(getData.postal_code, "123456");

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
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

    it('POST /grant', async () => {
        try {
            // Create AccessRights
            let accessRights = { 
                employee_id: newEmployee.id, 
                access_rights: [
                    {
                        view_id: 2,
                        has_write_access: false
                    },
                    {
                        view_id: 3,
                        has_write_access: true
                    },
                ]
            }
            await http.post(`/employee/grant`, accessRights);

            // Retrieve employee
            const { data: getData } = await http.get(`/employee?id=${newEmployee.id}`);

            // Assert changes
            assert.equal(getData.access_rights.length, 2);
            assert.equal(getData.access_rights[0].view_id, 2);
            assert.equal(getData.access_rights[0].has_write_access, false);
            assert.equal(getData.access_rights[1].view_id, 3);
            assert.equal(getData.access_rights[1].has_write_access, true);

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    })

    it('POST /grant (upsert)', async () => {
        try {
            // Create AccessRights
            let accessRights = { 
                employee_id: newEmployee.id, 
                access_rights: [
                    {
                        view_id: 2,
                        has_write_access: true
                    },
                    {
                        view_id: 3,
                        has_write_access: true
                    },
                ]
            }
            await http.post(`/employee/grant`, accessRights);

            // Retrieve employee
            const { data: getData } = await http.get(`/employee?id=${newEmployee.id}`);

            // Assert changes
            assert.equal(getData.access_rights.length, 2);
            assert.equal(getData.access_rights[0].view_id, 2);
            assert.equal(getData.access_rights[0].has_write_access, true);
            assert.equal(getData.access_rights[1].view_id, 3);
            assert.equal(getData.access_rights[1].has_write_access, true);

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    })

    it('POST /revoke', async () => {
        try {
            // Remove AccessRights
            let accessRights = { 
                employee_id: newEmployee.id, 
                access_rights: [
                    {
                        view_id: 2,
                    },
                ]
            }
            await http.post(`/employee/revoke`, accessRights);

            // Retrieve employee
            const { data: getData } = await http.get(`/employee?id=${newEmployee.id}`);

            // Assert changes
            assert.equal(getData.access_rights.length, 1);
            assert.equal(getData.access_rights[0].view_id, 3);
            assert.equal(getData.access_rights[0].has_write_access, true);

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    })

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

    it('DELETE /', async () => {
        try {
            // Login as Admin
            http = await loginAsAdmin();

            // Delete employee
            await http.delete(`/employee?id=${newEmployee.id}`);

            // Retrieve employee
            const { data: getData } = await http.get(`/employee?id=${newEmployee.id}`);

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

        // Cannot login anymore
        try {
            http = await login(newEmployee.username, newPassword);
        } catch(err) { 
            assert.equal(err.response.data, "This account does not exist anymore.");
        }
    });

})