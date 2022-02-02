const assert = require('assert');
const { loginAsAdmin } = require('.');

describe('/leave', () => {

    let http;
    let newEmployee;
    let newLeaveAccounts = [];
    let newLeaveApplications = [];

    it('POST /account', async () => {
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

            for (let i = 0; i < 5; i++ ) {
                let leaveAccount = {
                    employee_id: newEmployee.id, 
                    entitled_days: 10+i, 
                    entitled_rollover: 4, 
                    leave_type_id: i+1
                }
                const { data: postDataLeaveAccount } = await http.post(`/employee/leave/account`, leaveAccount);
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

                // Update to APPROVED
                const { data: putData } = await http.put(`/employee/leave/application`, {leave_application_id: postData.id, leave_status_id: 2});
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

                // Update to APPROVED
                const { data: putData } = await http.put(`/employee/leave/application`, {leave_application_id: postData.id, leave_status_id: 2});
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

    it('GET /account', async () => {
        try {
            // Retrieve leave account
            const { data: getData } = await http.get(`/employee/leave/account?employee_id=${newEmployee.id}`);

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