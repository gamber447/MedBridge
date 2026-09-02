\# MedBridge



\## Secure Medical Funding \& Verification Platform



MedBridge is a full-stack healthcare funding and verification platform designed to help connect patients, medical verification processes, donors, and funding workflows through a secure digital system.



The platform focuses on improving \*\*trust, transparency, verification, and controlled fund allocation\*\* in medical funding.



\---



\## Key Features



\### 🏥 Medical Case Management



\* Patient medical funding cases

\* Treatment cost and funding information

\* Structured medical case data

\* Case status tracking



\### 🔐 Medical Verification



\* Hospital verification

\* Doctor verification

\* Medical document integrity checks

\* Information matching

\* Digital signatures

\* QR-based verification



\### 🛡️ Security \& Trust



\* JWT-based authentication

\* Password hashing with bcrypt

\* Digital signatures

\* Document integrity verification

\* QR verification

\* Trust-score calculation

\* Audit logging

\* Role-based authentication



\### 💰 Funding \& Donations



\* Donor accounts

\* Funding requests

\* Donation allocation

\* Funding status management

\* Payment workflow integration



\### 🏦 Bank-System Integration



MedBridge includes a separate bank-system component to simulate secure financial workflows between the medical funding platform and banking services.



The bank system supports:



\* Bank accounts

\* Donor accounts

\* Funding requests

\* Reserved balances

\* Transactions

\* Settlement workflows



\### 🧪 Testing



The project includes automated tests covering:



\* File integrity

\* QR generation

\* QR verification

\* Digital signatures

\* Verification engine functionality



Synthetic test data is used for demonstration and testing purposes.



\---



\## Technology Stack



\### Backend



\* Python

\* FastAPI

\* SQLAlchemy

\* SQLite

\* JWT

\* bcrypt



\### Frontend



\* React

\* Vite

\* JavaScript

\* HTML/CSS



\### Security



\* JWT authentication

\* bcrypt password hashing

\* Digital signatures

\* QR verification

\* File integrity verification

\* Audit logging



\### Database



\* SQLite

\* SQLAlchemy ORM



\---



\## Project Structure



```text

MedBridge/

│

├── backend/

│   ├── allocation\_engine.py

│   ├── audit\_service.py

│   ├── auth\_dependencies.py

│   ├── auth\_service.py

│   ├── donor\_schemas.py

│   ├── funding\_service.py

│   ├── jwt\_service.py

│   ├── main.py

│   ├── payment\_service.py

│   ├── risk\_engine.py

│   └── verification\_engine.py

│

├── bank-system/

│   ├── backend/

│   └── frontend/

│

├── database/

│   ├── database.py

│   └── models.py

│

├── frontend/

│   ├── src/

│   ├── public/

│   └── package.json

│

├── security/

│   ├── integrity.py

│   ├── qr\_generator.py

│   ├── qr\_verification.py

│   ├── signature.py

│   └── verification\_engine.py

│

├── tests/

│   ├── test\_integrity.py

│   ├── test\_qr\_generator.py

│   ├── test\_qr\_verification.py

│   ├── test\_signature.py

│   └── test\_verification\_engine.py

│

└── README.md

```



\---



\## Security Notice



This repository intentionally excludes local secrets and sensitive runtime data.



The following are excluded through `.gitignore`:



\* Environment variables

\* Local databases

\* Database backups

\* Virtual environments

\* Uploaded files

\* JWT secret files

\* Local logs

\* Development-only backup files



Do not commit real patient information, medical documents, authentication secrets, API keys, private keys, or production credentials.



\---



\## Configuration



MedBridge uses environment variables for sensitive configuration.



Create a local `.env` file based on the variables required by your local configuration.



\*\*Never commit the `.env` file to GitHub.\*\*



\---



\## Running the Project



\### Backend



Create and activate a Python virtual environment:



```bash

python -m venv venv

```



Windows:



```powershell

.\\venv\\Scripts\\Activate.ps1

```



Install the required Python dependencies:



```bash

pip install -r requirements.txt

```



Start the FastAPI backend according to the project's local configuration.



\### Frontend



Navigate to the frontend directory:



```bash

cd frontend

```



Install dependencies:



```bash

npm install

```



Start the development server:



```bash

npm run dev

```



\### Bank System



The bank-system contains its own backend and frontend components.



Navigate into the relevant directory and install its dependencies before starting the services.



\---



\## Testing



Run the Python test suite with:



```bash

pytest

```



The tests use synthetic/demo data and are intended to validate core security and verification functionality.



\---



\## Security Architecture



The project separates several security responsibilities:



```text

Patient / Donor

&#x20;      │

&#x20;      ▼

&#x20;  MedBridge

&#x20;      │

&#x20;      ├── Authentication

&#x20;      │

&#x20;      ├── Medical Verification

&#x20;      │

&#x20;      ├── Document Integrity

&#x20;      │

&#x20;      ├── Digital Signature

&#x20;      │

&#x20;      ├── QR Verification

&#x20;      │

&#x20;      ├── Trust / Risk Assessment

&#x20;      │

&#x20;      ├── Funding Allocation

&#x20;      │

&#x20;      └── Audit Logging

&#x20;                   │

&#x20;                   ▼

&#x20;             Bank System

&#x20;                   │

&#x20;                   ├── Funding Requests

&#x20;                   ├── Accounts

&#x20;                   ├── Transactions

&#x20;                   └── Settlement

```



\---



\## Project Status



\*\*Status: Completed Development / Demonstration Project\*\*



MedBridge was developed as a full-stack project demonstrating secure healthcare funding, verification, authentication, financial workflow integration, and security controls.



\---



\## Disclaimer



MedBridge is a software demonstration/project and is \*\*not a production healthcare or financial service\*\*.



It should not be used with real patient information, real medical records, real financial accounts, or production credentials without appropriate security, privacy, regulatory, and compliance controls.



\---



\## Author



\*\*Ganesh Narsingu\*\*



GitHub: \[@gamber447](https://github.com/gamber447)



