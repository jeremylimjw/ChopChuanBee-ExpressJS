module.exports = (params) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Change Password</title>
    <style>
        .wrapper {
            height: 100%;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 50px 50px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .container {
            background-color: #fff;
            padding: 10px 50px;
            width: 500px;
            border: 1px solid rgba(27, 31, 35, 0.15);
        }

        .greeting {
            font-size: 26px;
            font-weight: bold;
        }

        p {
            text-align: center;
            margin: 10px 0;
        }

        .content {
            background-color: #cdcdcd6e;
            color: #3a9aed;
            font-size: 26px;
            font-weight: bold;
            padding: 5px;
        }

        .tips {
            color: #818181;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <p class="greeting">Hello ${params.name},</p>
            <p class="subtitle">Your new account has been created</p>
            <p class="greeting">Username</p>
            <div class="content">
                <p>${params.username}</p>
            </div>
            <p class="greeting">Password</p>
            <div class="content">
                <p>${params.password}</p>
            </div>
            <p class="tips">Please change your password immediately after logging in.</p>
            <p class="tips">This is a system generated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`