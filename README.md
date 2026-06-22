# ZeroQ

> **Because entry shouldn't take an hour.**

A QR-powered event registration, verification, and attendance management platform designed to streamline event check-ins, reduce queues, and simplify attendee validation.

---

## Overview

ZeroQ aims to eliminate the inefficiencies of manual event entry processes commonly seen at university events, hackathons, cultural festivals, and conferences.

Instead of relying on payment screenshots, manual ID verification, and spreadsheets, organizers can verify participants beforehand and issue secure QR-based tickets. At the venue, volunteers simply scan the QR code to validate entry and record attendance instantly.

---

## The Problem

Traditional event entry often involves:

* Manual payment verification
* Student ID checks
* Spreadsheet lookups
* Long waiting lines
* Duplicate entries
* Volunteer overload

These processes slow down event operations and create a poor attendee experience.

---

## The Solution

ZeroQ digitizes the complete attendee journey:

**Registration → Verification → QR Ticket Generation → Check-In → Attendance Tracking**

The platform enables organizers to manage registrations efficiently while providing attendees with a faster and smoother entry experience.

---

## Planned Features

* Secure User Authentication
* Role-Based Access Control (Student, Admin, Volunteer)
* Event Creation & Management
* Registration Approval Workflow
* QR Ticket Generation
* QR-Based Check-In
* Attendance Tracking
* Duplicate Entry Prevention
* Event Analytics Dashboard

---

## Tech Stack

### Backend

* Python
* FastAPI
* PostgreSQL
* SQLAlchemy
* JWT Authentication

### Frontend

* HTML
* CSS
* JavaScript

### Tools

* Git
* GitHub
* Postman
* qrcode
* html5-qrcode

---

## Project Structure

```text
ZeroQ/
│
├── backend/
├── frontend/
├── docs/
│
└── README.md
```

---

## Roadmap

### Version 1

* Event Management
* Registration System
* Payment Verification
* QR Ticket Generation
* Attendance Tracking

### Version 2

* Email Notifications
* PDF Tickets
* Analytics Dashboard
* Payment Gateway Integration

### Version 3

* Mobile Application
* WhatsApp Notifications
* Multi-Organization Support

---

## Status

🚧 Currently in development.

The initial focus is on building the backend architecture using FastAPI, followed by authentication, event management, registration workflows, and QR-based attendance tracking.

---

## Inspiration

ZeroQ was inspired by real-world challenges faced during university event management, where manual verification processes created long queues and operational bottlenecks.

The goal is simple:

**Because entry shouldn't take an hour.**
