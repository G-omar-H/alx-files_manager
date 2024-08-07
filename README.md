# 📁✨ Files Manager - Project 0x04

Welcome to the **Files Manager** project! This advanced task integrates key concepts from our back-end trimester, including authentication, NodeJS, MongoDB, Redis, pagination, and background processing. Let's build a robust file upload and management platform!

### 🎯 Project Objectives
- **User Authentication**: Secure access via token authentication.
- **File Listing**: Retrieve and display all uploaded files.
- **File Upload**: Enable users to upload new files.
- **Permission Management**: Modify file permissions.
- **File Viewing**: Access and view files.
- **Thumbnail Generation**: Create image thumbnails.

### 👥 Author
- **Ghazi Omar**

### 📅 Project Timeline
- **Start Date**: August 1, 2024, 4:00 AM
- **End Date**: August 8, 2024, 4:00 AM
- **Checker Release**: August 2, 2024, 10:00 PM

### 🚀 Project Summary
This project embodies our journey through back-end development. We will build a comprehensive platform featuring user authentication, file management, and image processing capabilities.

### 📚 Resources
- [Node.js Getting Started](https://nodejs.org/en/docs/guides/getting-started-guide/)
- [Process API Documentation](https://nodejs.org/dist/latest-v12.x/docs/api/process.html)
- [Express Getting Started](https://expressjs.com/en/starter/installing.html)
- [Mocha Documentation](https://mochajs.org/)
- [Nodemon Documentation](https://nodemon.io/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Bull Documentation](https://optimalbits.github.io/bull/)
- [Image Thumbnail](https://www.npmjs.com/package/image-thumbnail)
- [Mime-Types](https://www.npmjs.com/package/mime-types)
- [Redis Documentation](https://redis.io/documentation)

### 🧠 Learning Objectives
By the end of this project, we will:
- Develop an API using Express.
- Implement user authentication.
- Manage data with MongoDB.
- Utilize Redis for temporary data storage.
- Set up and use background workers for processing tasks.

### 🛠️ Requirements
- **Node.js Version**: 12.x.x
- **Linting**: ESLint
- **OS**: Ubuntu 18.04 LTS

### 📝 Provided Files
- **package.json**
- **.eslintrc.js**
- **babel.config.js**

### 💻 Installation
To set up your project, run:
```bash
$ npm install
```

### 📜 Tasks Overview
- **1. Redis utils**

    File: utils/redis.js
    Description: Create RedisClient class with methods to interact with Redis.

- **2. MongoDB utils**

    File: utils/db.js
    Description: Create DBClient class to handle MongoDB interactions.

- **3. First API**

    Files: server.js, routes/index.js, controllers/AppController.js
    Description: Set up an Express server with basic status and stats endpoints.

- **4. Create a new user**

    Files: routes/index.js, controllers/UsersController.js
    Description: Endpoint to create new users, including validation and password hashing.

- **5. Authenticate a user**

    Files: routes/index.js, controllers/AuthController.js
    Description: Implement user authentication and session management.

- **6. First file**

    Files: routes/index.js, controllers/FilesController.js
    Description: Endpoint to handle file uploads, validation, and storage.

### 🌟 Usage Examples

**Connect and Authenticate a User**

```bash

$ curl -X GET 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE="
```

**Create a New File**

```bash

$ curl -X POST 0.0.0.0:5000/files -H "X-Token: your_token" -H "Content-Type: application/json" -d '{ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }'
```

### 🔍 Testing

**Run tests using Mocha:**

```bash

$ npm run test
```

### 📂 Repository

GitHub Repository: alx-files_manager

