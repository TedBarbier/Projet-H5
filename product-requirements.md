# Product Requirements Document (PRD) - INSA Sports Event App

## 1. Project Overview
**Goal**: Create a web application for an inter-INSA sports event.
**Target Audience**: Approx. 1000 participants (students, staff).
**Key Features**: Real-time information, user management, secure payments, event logistics.

## 2. Functional Requirements

### 2.1 User Management & Registration
*   **Authentication**: Restricted to `@insa-xxx.fr` email addresses.
*   **Profile Management**:
    *   Select Sport (from predefined list).
    *   Select School of origin.
*   **Payments**: Secure payment integration (Stripe/Lydia API).

### 2.2 Real-Time Information
*   **News Feed**: Main page with announcements and push notifications.
*   **Dynamic Schedule**: Weekend event calendar updates.
*   **Geolocation**: Map of event locations (GPS).

### 2.3 Interaction & Scoring
*   **Live Score**: Real-time result updates managed by staff.
*   **Voting System**: Election for "Best Delegation/School".

### 2.4 Logistics & "Badging" (Catering)
*   **Dynamic QR Code**: Unique pass generation for meals.
*   **NFC Support**: Compatible with NFC terminals.

### 2.5 Admin Interface (Staff)
*   Manage registrations and export lists.
*   Modify schedules in real-time.
*   Scan badges for meal management.

## 3. Technical Specifications

### 3.1 Performance & Scalability
*   **Capacity**: Support 1000 simultaneous users.
*   **Architecture**:
    *   **WebSockets**: Required for live scores and updates.
    *   **Redis**: Caching layer for performance.

### 3.2 Security
*   **Encryption**: HTTPS/TLS for all data.
*   **Protection**: Anti-SQL injection, XSS protection.
*   **Privacy**: GDPR compliance (user consent management).

### 3.3 UI/UX & Theming
*   **Dual Theme Support**:
    *   **Standard**: Red (`#C1002A`)
    *   **CVL**: Magenta (`#EC008C`)
