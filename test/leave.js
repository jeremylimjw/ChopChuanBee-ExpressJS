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
                username: "bobby", 
                email: "nuschopchuanbee@gmail.com", 
                role_id: 2, 
                contact_number: "84726782", 
                nok_name: "Matthew McCaughnohaugh", 
                nok_number: "82747282", 
                address: "21 Old Airport Rd", 
                postal_code: "624902", 
                send_email: false
            }
            const { data: postDataEmployee } = await http.post(`/employee`, employee);
            newEmployee = postDataEmployee;

            // Create leave accounts for employee
            for (let i = 0; i < 5; i++ ) {
                let leaveAccount = {
                    employee_id: newEmployee.id, 
                    entitled_days: 10, 
                    entitled_rollover: 4, 
                    leave_type_id: i+1
                }
                const { data: postDataLeaveAccount } = await http.post(`/employee/leave`, leaveAccount);
                newLeaveAccounts.push(postDataLeaveAccount);
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


    it('UPDATE /', async () => {
        try {
            // Update leave account
            const modifyLeaveAccount = {...newLeaveAccounts[0], entitled_days: 20 };
            const { data: putData } = await http.put(`/employee/leave`, modifyLeaveAccount);

            // Retrieve leave account
            const { data: getData } = await http.get(`/employee/leave?leave_account_id=${newLeaveAccounts[0].id}`);
            assert.notEqual(getData, null);

            // Assert changes
            assert.equal(getData.entitled_days, 20);

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
            assert.notEqual(getData2.length, 0)

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
            for (let i = 0; i < 3; i++) {
                // Create Leave Application
                let leaveApplication = { 
                    employee_id: newEmployee.id, 
                    paid: true, 
                    start_date: new Date(), 
                    end_date: new Date(), 
                    num_days: i + 1, 
                    remarks: "", 
                    leave_account_id: newLeaveAccounts[0].id
                }
                const { data: postData } = await http.post(`/employee/leave/application`, leaveApplication);
                newLeaveApplications.push(postData);
            }
            
            for (let i = 0; i < 3; i++) {
                // Create Leave Application
                let leaveApplication = { 
                    employee_id: newEmployee.id, 
                    paid: true, 
                    start_date: new Date(), 
                    end_date: new Date(), 
                    num_days: i + 2, 
                    remarks: "", 
                    leave_account_id: newLeaveAccounts[1].id
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
            for (let application of newLeaveApplications) {
                const { data: putData } = await http.put(`/employee/leave/application`, { id: application.id, leave_status_id: 2 });
            }
            
            // Retrieve leave account balances
            const { data: getData1 } = await http.get(`/employee/leave?leave_account_id=${newLeaveAccounts[0].id}`);
            assert.equal(getData1.balance, 14)

            const { data: getData2 } = await http.get(`/employee/leave?leave_account_id=${newLeaveAccounts[1].id}`);
            assert.equal(getData2.balance, 1)

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
            // Create new leave application
            const leaveApplication = { 
                employee_id: newEmployee.id, 
                paid: true, 
                start_date: new Date(), 
                end_date: new Date(), 
                num_days: 1, 
                remarks: "", 
                leave_account_id: newLeaveAccounts[3].id
            }
            const { data: postData } = await http.post(`/employee/leave/application`, leaveApplication);
            newLeaveApplications.push(postData);

            // Update applications to CANCELLED
            const { data: deleteData } = await http.delete(`/employee/leave/application?id=${postData.id}`);
            
            // Retrieve leave account balances
            const { data: getData } = await http.get(`/employee/leave/application?leave_application_id=${postData.id}`);
            assert.equal(getData.leave_status_id, 4)

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