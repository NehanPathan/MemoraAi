# MemoraAI - AI-Powered Visual Storytelling Platform

Transform cherished memories into cinematic visual stories with the power of AI.

## Overview

MemoraAI is a full-stack application that generates beautiful memory cards and digital keepsakes from your uploaded photos. Using OpenAI's advanced image generation and a cinematic design system, it creates emotionally resonant visual stories.

**Key Features:**
- 📸 Multi-photo upload with real-time progress tracking
- 🎬 AI-powered cinematic memory card generation
- 🎨 Multiple visual themes (nostalgic, travel, family)
- 📱 Responsive, accessible UI with dark mode
- ⚡ Real-time streaming updates via Server-Sent Events
- 🔒 Enterprise-grade security and validation
- 📦 Production-ready deployment options

## Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Image Generation:** OpenAI GPT-4o API
- **CDN:** ImageKit (image storage & optimization)
- **Async:** asyncio + uvicorn

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **State Management:** Zustand
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Forms:** React Hook Form + Zod

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- API Keys for:
  - OpenAI GPT-4o
  - ImageKit (private & public keys)

### Installation

#### 1. Clone & Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API keys

# Run development server
uvicorn main:app --reload
```

Backend runs on `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

#### 2. Setup Frontend

```bash
cd memoraai-frontend

# Install dependencies
npm install

# Configure environment (optional)
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

Frontend runs on `http://localhost:5173`

#### 3. Test API

```bash
# Health check
curl http://localhost:8000/health

# API documentation
open http://localhost:8000/docs
```

## Environment Configuration

### Required Variables

```bash
OPENAI_API_KEY=sk-...                    # OpenAI API key
IMAGEKIT_PRIVATE_KEY=private_...         # ImageKit private key
IMAGEKIT_PUBLIC_KEY=public_...           # ImageKit public key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...
```

### Optional Variables

```bash
ENVIRONMENT=development                  # development | staging | production
DATABASE_URL=postgresql://...            # Database connection string
API_KEY=your-secret-key                 # API authentication
CORS_ORIGINS=http://localhost:5173,...  # CORS allowed origins
LOG_LEVEL=INFO                          # Logging level
```

See `backend/.env.example` for all configuration options.

## Project Structure

```
.
├── backend/                    # FastAPI application
│   ├── main.py                # Application entry point
│   ├── routes.py              # API routes & handlers
│   ├── models.py              # Database models
│   ├── config.py              # Configuration management
│   ├── database.py            # Database setup
│   ├── services/              # Business logic
│   │   ├── generator.py       # Story generation pipeline
│   │   ├── openai_service.py  # OpenAI integration
│   │   └── imagekit_service.py# Image upload/CDN
│   ├── utils/                 # Utilities
│   │   ├── auth.py            # Authentication
│   │   ├── file_validation.py # File type & size validation
│   │   └── circuit_breaker.py # Resilience pattern
│   ├── middleware/            # HTTP middleware
│   │   ├── logging_middleware.py
│   │   └── rate_limit_middleware.py
│   ├── Dockerfile             # Container image
│   └── requirements.txt        # Python dependencies
│
├── memoraai-frontend/         # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── common/        # Reusable UI components
│   │   │   ├── layout/        # Page layout components
│   │   │   ├── story/         # Story-specific components
│   │   │   └── upload/        # Upload components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   ├── store/             # Zustand state management
│   │   ├── types/             # TypeScript type definitions
│   │   ├── api.ts             # API client
│   │   └── App.tsx            # Root component
│   ├── Dockerfile.dev         # Development container
│   └── package.json
│
├── docker-compose.yml         # Full stack orchestration
├── DEPLOYMENT_GUIDE.md        # Production deployment
├── AUDIT_REPORT.md           # Security & code audit
└── README.md                 # This file
```

## API Endpoints

### Public Endpoints

#### Health Check
```http
GET /health
```

Returns database and circuit breaker status.

#### Upload Memory Photo
```http
POST /api/upload-memory-photo
Content-Type: multipart/form-data
X-API-Key: optional

Form Data:
- file: (binary image file)
```

**Validation:**
- File type: JPEG, PNG, WebP, GIF, BMP (magic byte validation)
- File size: Max 10MB per file
- Batch size: Max 100MB total

**Response:**
```json
{ "url": "https://ik.imagekit.io/..." }
```

#### Create Story Job
```http
POST /api/story-jobs
Content-Type: application/json
X-API-Key: optional

{
  "title": "Summer Memories",
  "description": "A warm summer day with friends",
  "memory_type": "travel",
  "theme_name": "cinematic_travel",
  "photo_urls": ["https://ik.imagekit.io/..."],
  "num_memory_cards": 3
}
```

**Response:**
```json
{ "story_job_id": "uuid" }
```

#### Get Story Job
```http
GET /api/story-jobs/{story_job_id}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Summer Memories",
  "status": "completed",
  "memory_cards": [
    {
      "id": "uuid",
      "status": "completed",
      "image_url": "https://ik.imagekit.io/...",
      "variants": {
        "instagram_story": "...",
        "instagram_post": "..."
      }
    }
  ]
}
```

#### Stream Generation Progress (SSE)
```http
GET /api/story-jobs/{story_job_id}/stream
```

**Events:**
- `memory_card_ready` - Card generated successfully
- `memory_card_failed` - Card generation failed
- `story_completed` - All cards complete
- `story_error` - Unexpected error occurred

## Available Themes

### Nostalgic Film
Vintage aesthetic with soft warm tones, cinematic lighting, and emotional atmosphere.

### Cinematic Travel
Luxury editorial scenery with vibrant depth and premium composition.

### Warm Family
Cozy candid moments with heartfelt storytelling light.

## Development

### Running Tests

```bash
# Backend tests (placeholder)
pytest backend/

# Frontend tests
npm test
```

### Code Quality

```bash
# Backend linting
flake8 backend/

# Frontend linting
npm run lint
```

### Building for Production

#### Backend Docker Image
```bash
cd backend
docker build -t memoraai-backend:latest .
docker run -p 8000:8000 --env-file .env memoraai-backend:latest
```

#### Frontend Production Build
```bash
cd memoraai-frontend
npm run build
npm run preview  # Test production build
```

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for comprehensive deployment instructions.

### Quick Docker Deployment

```bash
docker-compose up -d
```

This starts:
- Backend API on port 8000
- Frontend on port 5173
- PostgreSQL database on port 5432

## Security

### File Upload Security
- ✅ Magic byte validation (not just MIME type)
- ✅ File size limits per file and batch
- ✅ Safe filename generation
- ✅ Malware scanning via external service
- ✅ Rate limiting (100 requests/hour per IP)

### API Security
- ✅ Optional API key authentication
- ✅ CORS origin validation
- ✅ Request size limits
- ✅ SQL injection protection (SQLModel)
- ✅ XSS protection via React
- ✅ CSRF protection (SameSite cookies)

### Data Security
- ✅ Environment variable validation on startup
- ✅ Secure error messages (no internal details leaked)
- ✅ Database connection pooling
- ✅ SSL/TLS in production
- ✅ Regular backups

### Production Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Generate strong `API_KEY` (32+ characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Restrict CORS to your domain
- [ ] Setup database backups
- [ ] Monitor error rates and performance
- [ ] Enable logging and intrusion detection
- [ ] Review security headers
- [ ] Rotate API keys regularly

See [AUDIT_REPORT.md](./AUDIT_REPORT.md) for full security analysis.

## Performance

### Optimization Features
- 🚀 Async/await for all I/O operations
- 💾 Database connection pooling
- 🗂️ Indexed queries on frequently-accessed fields
- 📊 Circuit breaker for OpenAI API
- 🔄 Automatic retry with exponential backoff
- 🏞️ ImageKit CDN for media optimization
- 💫 Lazy loading for images
- 📦 Gzip compression

### Monitoring

```bash
# Health status with circuit breaker info
curl http://localhost:8000/status

# Detailed system status
curl -H "X-API-Key: your-key" http://localhost:8000/status
```

## Troubleshooting

### Backend Won't Start

```bash
# Check configuration validation
python -c "from config import validate_config; validate_config()"

# Check dependencies
pip list

# Check database
python -c "from database import engine; print(engine)"
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U memoraai -d memoraai -c "SELECT 1"

# Check DATABASE_URL format
echo $DATABASE_URL
```

### Image Upload Fails

- Check file format (JPEG, PNG, WebP, GIF)
- Verify file size < 10MB
- Check ImageKit API credentials
- Verify CORS configuration

### OpenAI API Errors

```bash
# Verify API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check usage and quota
# Visit https://platform.openai.com/account/usage
```

## Contributing

### Development Workflow

1. Create a feature branch: `git checkout -b feature/name`
2. Make changes and test locally
3. Commit with descriptive messages
4. Push to GitHub and create a pull request

### Code Style

- **Python:** PEP 8 (use `flake8`)
- **TypeScript:** ESLint config + Prettier
- **Git:** Semantic commit messages

## Costs

### API Costs
- **OpenAI GPT-4o API:** ~$0.10 per image (1024x1024)
- **ImageKit:** Free tier includes 25GB bandwidth/month

### Infrastructure (AWS Example)
- **EC2:** t3.medium ($25-50/month)
- **RDS PostgreSQL:** db.t3.micro ($15-30/month)
- **CloudFront CDN:** $0.085/GB outgoing

## Roadmap

### Q3 2026
- [ ] User authentication system
- [ ] Save favorite stories
- [ ] Export options (PDF, video)
- [ ] Mobile app (React Native)

### Q4 2026
- [ ] Advanced filtering & search
- [ ] Collaborative story creation
- [ ] Social sharing features
- [ ] Analytics dashboard

## License

This project is proprietary and confidential.

## Support

- **Issues:** Create a GitHub issue with reproduction steps
- **Security:** Report security issues to security@yourdomain.com
- **Documentation:** See comprehensive guides in `/docs`

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [ImageKit Documentation](https://docs.imagekit.io/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Built with ❤️ for preserving memories in style.**
