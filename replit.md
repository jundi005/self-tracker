# Overview

Self Tracker is a mobile-first web application for daily, weekly, and monthly habit tracking with Google Sheets integration. The app provides comprehensive tracking capabilities including daily checklists, weekly goals, monthly targets, finance management, and business tracking with offline-first functionality and real-time data visualization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a vanilla JavaScript modular architecture with ES6 modules:

- **Modular Design**: Core functionality split into specialized modules (app.js, storage.js, api.js, charts.js, renderers.js)
- **Mobile-First Responsive Design**: CSS grid and flexbox layout optimized for screens ≥360px width
- **Single Page Application**: Dynamic page switching without full reloads using JavaScript routing
- **Offline-First Strategy**: LocalStorage as primary storage with Google Sheets sync capability

## Backend Architecture
**Google Apps Script Web App** serves as the backend:
- RESTful API endpoints for CRUD operations
- Token-based authentication for security
- Direct Google Sheets integration for data persistence
- CORS-enabled for cross-origin requests

## Data Storage Solutions
**Dual Storage Strategy**:
- **Primary**: Google Sheets via Apps Script API for cloud persistence and collaboration
- **Fallback**: Browser LocalStorage for offline functionality and performance
- **Sync Logic**: Bidirectional synchronization between local and cloud storage with conflict resolution

## Authentication and Authorization
- **Token-based authentication**: Simple API token validation in Google Apps Script
- **Configurable access**: Users set up their own Google Apps Script deployment with custom tokens
- **No user accounts**: Direct integration with user's own Google Sheets

## Data Architecture
**Six main data entities**:
- **Daily**: Checklist items with 30-day grid tracking
- **Weekly**: Weekly goals with 4-week tracking periods
- **Monthly**: Monthly targets with 4-month tracking
- **Finance**: Income/expense transactions with budget analysis
- **Business**: Business transactions with profit/loss tracking
- **Settings**: User preferences, categories, and API configuration

## Visualization Strategy
**Chart.js integration** for dashboard analytics:
- Line charts for daily progress trends
- Bar charts for weekly/monthly comparisons
- Donut charts for category breakdowns
- Clustered charts for business analytics

# External Dependencies

## Core Libraries
- **Chart.js**: Data visualization and dashboard charts
- **Google Apps Script**: Backend API and Google Sheets integration

## Google Services
- **Google Sheets API**: Primary data storage via Apps Script
- **Google Apps Script Web App**: Backend hosting and API endpoints

## Development Dependencies
- **Node.js HTTP Server**: Development server for local testing (port 5000)
- **No build tools**: Vanilla JavaScript with ES6 modules for simplicity

## Browser APIs
- **LocalStorage API**: Offline data persistence
- **Fetch API**: HTTP client for Google Apps Script communication
- **ES6 Modules**: Code organization and dependency management

## Third-party Integrations
The application is designed to integrate with user's own Google account:
- Users deploy their own Google Apps Script instance
- Direct connection to user's Google Sheets for data storage
- No external services or accounts required beyond Google