# TCG Shopify App

A modern TCG (Trading Card Game) e-commerce application built with Fastify, Vite, React, and PostgreSQL, featuring server-side rendering for optimal SEO and performance.

## 🚀 Quick Start

### Prerequisites

- Node.js 22.19.0+
- PostgreSQL database
- npm or pnpm

### Installation

1. Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd tcg-shopify
npm install
```

2. Configure your environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and other configuration:
```env
# Server Configuration
PORT=3003
BASE_URL=http://localhost
CLOSE_GRACE_DELAY=10000
RATE_LIMIT_MAX=500

# Logging Configuration
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
ENABLE_CONSOLE_OUTPUT=true

# Database Configuration (PostgreSQL)
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tcg_shopify
DB_USER=postgres
DB_PASSWORD=your_password_here
# Alternative: Use connection string instead of individual fields
# DB_CONNECTION_STRING=postgresql://username:password@localhost:5432/tcg_shopify

# Session Configuration
COOKIE_SECRET=your_64_character_hex_secret_here
COOKIE_NAME=tcg_session
COOKIE_SECURED=false

# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret_here
SHOPIFY_HOST_NAME=your-app-domain.com

# Redis Configuration
REDIS_URL=redis://localhost:6379
# Alternative: Use individual fields
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password

# Application Settings
ALLOW_IFRAMES=true
```

3. Run database migrations:
```bash
npm run migrate
```

4. Start the development server:
```bash
npm run dev
```

5. Access the application at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## 🏗️ Architecture

### Tech Stack

- **Backend**: Fastify with TypeScript
- **Frontend**: React with SSR via @fastify/react
- **Database**: PostgreSQL with Knex.js migrations
- **Build Tool**: Vite for client-side bundling
- **Styling**: Tailwind CSS
- **Code Quality**: Biome for formatting and linting

### Project Structure

```
src/
├── app.ts              # Main Fastify application setup
├── server.ts           # Server entry point
├── client/             # React SSR application
│   ├── components/     # Reusable React components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Route pages
│   ├── stores/         # Valtio state management
│   └── utils/          # Client utilities
├── plugins/            # Fastify plugins
│   ├── custom/         # Custom business logic plugins
│   └── external/       # Third-party plugin configurations
├── routes/             # API route handlers
├── services/           # Business logic services
├── schemas/            # Zod validation schemas
└── types/              # TypeScript type definitions
```

## 📊 Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run fix` - Format and lint code with Biome
- `npm run migrate` - Run database migrations
- `npm run migrate:make` - Create new migration

### Database Management

This application uses Knex.js for database operations and migrations:

```bash
# Create a new migration
npm run migrate:make create_products_table

# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback
```

## 🔌 API Documentation

Interactive API documentation is available at `/api/docs` when running the application in development mode.

## 🎯 Features

- **Server-Side Rendering**: Optimized SEO and performance with React SSR
- **Type Safety**: Full TypeScript support across frontend and backend
- **Database Migrations**: Version-controlled schema changes with Knex.js
- **Authentication**: Session-based authentication with secure cookie handling
- **Rate Limiting**: Built-in request rate limiting and security headers
- **Real-time Features**: Server-sent events support for live updates
- **API-First Design**: RESTful API with OpenAPI documentation
- **Development Tools**: Hot reload, TypeScript checking, and code formatting

## 🔧 Configuration

The application uses environment variables for configuration. See `.env.example` for all available options:

- Database connection settings
- Session and cookie secrets
- Logging configuration
- Server port and host settings

## 🧪 Testing

```bash
# Run type checking
npm run typecheck

# Check code formatting and linting
npm run fix
```

## 📦 Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure production database connection
3. Run migrations: `npm run migrate`
4. Build the application: `npm run build`
5. Start the server: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- [React](https://reactjs.org/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework