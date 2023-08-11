# HR Management System

This is Assignment 2 for the DBS501 course at Seneca College. The project is developed by Khushwant Singh Rao.

## Project Overview

The HR Management System is a web-based application that allows users to manage employee data, job information, departments, and more. The system utilizes an Oracle database to store and manage data. It includes features such as:

- Employee Management: Hire new employees, update their details, and manage their information.
- Job Management: Add new job roles, update job descriptions, and manage salary ranges.
- Department Management: View and manage different departments within the organization.

The application makes use of stored procedures and triggers within the Oracle database to enforce business rules and data integrity.

## Installation and Setup

1. Clone the repository: ```git clone https://github.com/KHUSHU1501/HR-Management-System.git```
2. Navigate to the project directory: ```cd src```
3. Install the required dependencies: ```npm i```
4. Configure the Oracle database connection:
- Open `src/app.js` and update the database connection details.
5. Start the server: ```node app.js```
6. Access the application in your web browser at `http://localhost:3000`.

## Features

- Employee Hiring: Add new employees to the system with relevant details.
- Job Management: Create and update job roles, ensuring salary ranges are within acceptable limits.
- Department Overview: View and manage departments within the organization.
- Error Handling: The application provides real-time error feedback for a better user experience.
- Stored Procedures and Triggers: Utilizes Oracle stored procedures and triggers to enforce business rules.

## Technologies Used

- Node.js
- Express.js
- Oracle Database
- HTML/CSS
- EJS (Embedded JavaScript) for views
- etc.



