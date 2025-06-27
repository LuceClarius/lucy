# JavaScript Script Runner - System Architecture

## Overview

This is a full-stack web application for running, managing, and scheduling JavaScript scripts. It provides a Monaco-based code editor, execution environment, and scheduling system for automated script execution. The application features a modern React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Code Editor**: Monaco Editor for JavaScript code editing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: express-session with PostgreSQL store
- **File Processing**: Multer for JavaScript file uploads
- **Script Execution**: Node.js vm module for sandboxed execution

### Key Components

#### Database Schema
- **users**: User authentication and management
- **scripts**: JavaScript code storage with metadata
- **executions**: Execution history with status, output, and performance metrics
- **schedules**: Automated execution scheduling with frequency settings

#### API Structure
- RESTful endpoints for CRUD operations on scripts, executions, and schedules
- File upload endpoint for JavaScript files
- Script execution endpoint with real-time output capture
- Error handling and validation using Zod schemas

#### Frontend Components
- **Dashboard**: Main application interface with sidebar and editor
- **CodeEditor**: Monaco-based editor with syntax highlighting and IntelliSense
- **ScriptSidebar**: File management with upload, selection, and organization
- **ConsoleOutput**: Real-time execution results and error display
- **ExecutionHistory**: Historical execution tracking and analysis
- **ScheduleForm**: Automated execution scheduling interface

## Data Flow

1. **Script Management**: Users can create, edit, upload, and organize JavaScript files
2. **Code Editing**: Monaco editor provides syntax highlighting, error detection, and IntelliSense
3. **Script Execution**: Backend executes scripts in isolated vm context and captures output
4. **Result Processing**: Execution results are stored in database and displayed in real-time
5. **Scheduling**: Users can configure automated execution with various frequency options
6. **History Tracking**: All executions are logged with performance metrics and status

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **monaco-editor**: In-browser code editor
- **@radix-ui/**: Accessible UI component primitives

### Development Dependencies
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### Configuration Features
- **Hot Module Replacement**: Vite HMR for rapid development
- **Path Aliases**: Simplified imports with @ and @shared prefixes
- **Environment Variables**: Configurable settings for different deployment environments

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: ESBuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations manage schema changes

### Production Configuration
- **Replit Deployment**: Configured for Replit's autoscale deployment target
- **Port Configuration**: External port 80 mapping to internal port 5000
- **Environment Setup**: Node.js 20, PostgreSQL 16, and web modules

### Development Workflow
- **npm run dev**: Starts development server with HMR
- **npm run build**: Builds production-ready application
- **npm run start**: Runs production server
- **npm run db:push**: Applies database schema changes

## Changelog

```
Changelog:
- June 27, 2025. Discord bot fully operational with OpenAI integration and manual trigger
- June 27, 2025. Fixed JSON API responses and added fallback message system
- June 27, 2025. Fixed dotenv import error and integrated Discord bot scheduler
- June 26, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```