# SPID Utils – Metadata Generator & Certificate Rotation

This repository provides two core components required by a SPID Service Provider:

---

## 1. SP Metadata Generation

This module helps creating a fully compliant SP metadata XML.
It allows you to build your metadata using configurable parameters, including:

* SP information (entityID, organization, contacts)
* SSO endpoints
* signing/encryption certificates
* digest/signature algorithms
* XML signature support

The goal is to generate a ready-to-publish metadata document for SPID Identity Providers.

### 🔹 Quick Start

1. Enter the `spid_metadata` folder:

   ```bash
   cd spid_metadata
   ```
2. Start a simple Python HTTP server:

   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and navigate to:

   [http://localhost:8000](http://localhost:8000)

---

## 2. Certificate Rotation Mechanism

The rotation module manages the lifecycle of SPID certificates used for signing and encryption.

Supported operations include:

### ✔ Creation
- generate new certificates and private keys
- prepare future certificates for scheduled rotation

### ✔ Add / Remove
- add new certificates to the active set
- remove expired or invalid ones

### ✔ Sign / Remove Signatures
- apply signatures to metadata or related documents
- remove outdated or invalid signatures

### 🔹 Quick Start

1. Enter the `spid_rotator` folder:
   ```bash
   cd spid_rotator
   ```

2. Install dependencies (virtual environment):

   ```bash
   python3 -m venv venv
   # Activate the virtual environment
   # On Linux/macOS:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate

   pip install -r requirements.txt
   ```
3. Set up your `.env` file similar to `dot_env`
4. Run the certificate rotation script:

   ```bash
   python3 cert_rotation_manager.py
   ```

   Follow the prompts to manage certificate rotation.

---

## Why this repository exists

SPID requires:

* a valid metadata document
* valid signing certificates
* a rotation process that prevents service interruption

This repository offers reusable components to automate those tasks and keep your SPID Service Provider compliant.
