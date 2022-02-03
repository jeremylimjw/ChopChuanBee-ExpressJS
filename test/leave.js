const assert = require('assert');
const { loginAsAdmin } = require('.');

describe('/employee/leave', () => {

    let http;
    let newEmployee;
    let newLeaveAccounts = [];
    let newLeaveApplications = [];

    it('POST /', async () => {
        try {
            // Login
            http = await loginAsAdmin();

            // Create Employee
            let employee = { 
                name: "Bob Builder", 
                username: Math.random().toString(), // because of unique constraint
                email: Math.random().toString(), 
                role_id: 2, 
                contact_number: "84726782", 
                nok_name: "Matthew McCaughnohaugh", 
                nok_number: "82747282", 
                address: "21 Old Airport Rd", 
                postal_code: "624902", 
                send_email: false,
                access_rights: [],
            }
            const { data: postDataEmployee } = await http.post(`/employee`, employee);
            newEmployee = postDataEmployee;

            const { data: getData } = await http.get(`/employee/leave?employee_id=${newEmployee.id}`);
            newLeaveAccounts = getData;

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
            // Update leave account
            newLeaveAccounts = newLeaveAccounts.map(x => {
                return {
                    id: x.id,
                    entitled_days: 20
                };
            })

            const { data: putData } = await http.put(`/employee/leave`, { leave_accounts: newLeaveAccounts });

            // Retrieve leave account
            const { data: getData } = await http.get(`/employee/leave?employee_id=${newEmployee.id}`);
            getData.forEach(element => {
                assert.equal(element.entitled_days, 20);
            });

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
            // Retrieve leave account
            const { data: getData1 } = await http.get(`/employee/leave?employee_id=${newEmployee.id}`);
            assert.notEqual(getData1.length, 0)

            const { data: getData2 } = await http.get(`/employee/leave?leave_account_id=${newLeaveAccounts[0].id}`);
            assert.notEqual(getData2, null)

            const { data: getData3 } = await http.get(`/employee/leave`);
            assert.notEqual(getData3.length, 0)

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    });


    it('POST /application', async () => {
        try {
            for (let i = 0; i < 5; i++) {
                // Create Leave Application
                let leaveApplication = { 
                    employee_id: newEmployee.id, 
                    paid: true, 
                    start_date: new Date(new Date().getTime() + 7*24*60*60*1000), 
                    end_date: new Date(new Date().getTime() + 14*24*60*60*1000), 
                    num_days: 4, 
                    remarks: "", 
                    leave_account_id: newLeaveAccounts[0].id
                }
                const { data: postData } = await http.post(`/employee/leave/application`, leaveApplication);
                newLeaveApplications.push(postData);
            }

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    })


    it('UPDATE /application', async () => {
        try {
            // Update applications to APPROVED
            newLeaveApplications.forEach(element => {
                element.leave_status_id = 2;
                return element;
            })

            const { data: putData } = await http.put(`/employee/leave/application`, { leave_applications: newLeaveApplications });
            
            // Retrieve leave account balances
            const { data: getData1 } = await http.get(`/employee/leave?leave_account_id=${newLeaveAccounts[0].id}`);
            
            // Assert changes
            assert.equal(getData1.balance, 0)

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    })


    it('DELETE /application', async () => {
        try {
            // Update applications to CANCELLED
            for (let leaveApplication of newLeaveApplications) {
                const { data: deleteData } = await http.delete(`/employee/leave/application?id=${leaveApplication.id}`);
            }
            
            // Retrieve leave account balances
            const { data: getData } = await http.get(`/employee/leave?leave_account_id=${newLeaveAccounts[0].id}`);

            // Assert changes
            assert.equal(getData.balance, 20)

        } catch(err) {
            if (err.response) {
                console.log(err.response.status, err.response.data);
            } else {
                console.log(err);
            }
            assert.fail();
        }
    })


    it('GET /application', async () => {
        try {
            // Retrieve leave applications
            const { data: getData1 } = await http.get(`/employee/leave/application?leave_application_id=${newLeaveApplications[0].id}`);
            assert.notEqual(getData1, null);

            const { data: getData2 } = await http.get(`/employee/leave/application?leave_account_id=${newLeaveAccounts[0].id}`);
            assert.notEqual(getData2.length, 0);

            const { data: getData3 } = await http.get(`/employee/leave/application?employee_id=${newEmployee.id}`);
            assert.notEqual(getData3.length, 0);

            const { data: getData4 } = await http.get(`/employee/leave/application`);
            assert.notEqual(getData4.length, 0);

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