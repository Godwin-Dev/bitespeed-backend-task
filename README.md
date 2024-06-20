# Project Name: Bitespeed Backend Task

## Description
Bitespeed Backend Task: Identity Reconciliation

## Installation
1. Clone the repository: `git clone https://github.com/Godwin-Dev/bitespeed-backend-task.git`
2. Navigate to the project directory: `cd bitespeed-backend-task`
3. Install the dependencies: `npm install`

## Usage
To start the server, run the following command:
```
npm src/app.js

# or

npx nodemon src/app.js
```

## API Endpoints
- **`/identify`**: This endpoint is used to identify and reconcile contact details.

### POST `/identify`

#### Request Body
```json
{
  "email": "example@example.com",
  "phoneNumber": "1234567890"
}
```

#### Response
```json
{
  "contact": {
    "primaryContactId": number,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

### Example
You can test the endpoint using `curl`:
```sh
curl -X POST https://bitespeed-backend-task-f9f4.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "example@example.com", "phoneNumber": "1234567890"}'
```


## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.


