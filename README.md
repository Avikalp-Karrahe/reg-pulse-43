![RegPulse Banner](./banner.svg)

# RegPulse - Research-Grade Compliance Intelligence

> Switch on compliant conversations. Live voice AI that flags violations.

RegPulse is a cutting-edge compliance monitoring platform that uses advanced AI to analyze voice conversations in real-time, identifying potential regulatory violations and providing actionable insights for financial institutions and regulated industries.

## 🚀 Features

### Core Functionality
- **Real-time Voice Analysis** - Live monitoring of conversations with instant compliance flagging
- **Multi-format Audio Support** - Process various audio formats (MP3, WAV, M4A, etc.)
- **Risk Assessment** - Automated risk scoring with HIGH/MEDIUM/LOW severity classification
- **Evidence Tracking** - Precise timestamping and snippet extraction for violations
- **Demo Mode** - Comprehensive demo environment with sample data for testing

### Advanced Analytics
- **Compliance Dashboard** - Visual overview of risk metrics and trends
- **Call History** - Detailed logs of all processed conversations
- **Issue Management** - Categorized compliance violations with evidence
- **Regulatory Mapping** - Links violations to specific regulatory requirements

### Technical Capabilities
- **Streaming Analysis** - Real-time processing with live updates
- **Rules-based Detection** - Configurable compliance rules with AI fallback
- **Audio Transcription** - High-accuracy speech-to-text conversion
- **Evidence Extraction** - Automatic identification and timestamping of violations

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **AI/ML**: Toolhouse AI, Custom compliance rules engine
- **Audio Processing**: Web Audio API, File upload handling
- **State Management**: React Query, Context API
- **UI Components**: Shadcn/ui, Lucide React icons
- **Build Tools**: Vite, ESLint, PostCSS

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Avikalp-Karrahe/reg-pulse-43.git
   cd reg-pulse-43
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file with:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_TOOLHOUSE_API_KEY=your_toolhouse_api_key
   VITE_DEMO_MODE=false
   ```

4. **Database Setup**
   ```bash
   # Run Supabase migrations
   npx supabase db reset
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🎯 Demo Mode

RegPulse includes a comprehensive demo mode for testing and demonstration purposes:

### Enable Demo Mode
```bash
# Use demo environment
cp .env.demo .env
npm run dev
```

### Seed Demo Data
```bash
npm run seed-demo
```

Demo mode includes:
- **Sample Calls**: Pre-loaded conversations with various compliance scenarios
- **Risk Examples**: HIGH/MEDIUM/LOW severity violations
- **Audio Placeholders**: Sample audio files for testing
- **Complete Workflow**: End-to-end demonstration of the compliance process

## 🔧 Usage

### 1. Upload Audio Files
- Navigate to the Audio Input Setup page
- Upload audio files (MP3, WAV, M4A supported)
- Configure analysis parameters

### 2. Real-time Analysis
- Monitor live processing status
- View risk scores as they're calculated
- Track compliance violations in real-time

### 3. Review Results
- **Call History**: Browse all processed conversations
- **Analytics Dashboard**: View compliance trends and metrics
- **Issue Details**: Examine specific violations with evidence

### 4. Compliance Management
- Export violation reports
- Track remediation actions
- Generate regulatory documentation

## 📊 API Endpoints

### Core Endpoints
- `POST /api/upload` - Upload and process audio files
- `GET /api/calls` - Retrieve call history
- `GET /api/calls/:id` - Get specific call details
- `GET /api/analytics` - Fetch compliance analytics

### Demo Endpoints
- `GET /api/demo/calls` - Demo call data
- `GET /api/demo/issues` - Demo compliance issues

## 🏗️ Architecture

### Frontend Architecture
```
src/
├── components/          # Reusable UI components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configs
├── types/              # TypeScript type definitions
├── api/                # API integration layer
└── integrations/       # External service integrations
```

### Database Schema
- **calls**: Audio file metadata and processing status
- **issues**: Compliance violations and evidence
- **analytics**: Aggregated compliance metrics

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Ensure production environment variables are configured:
- Database connections
- API keys
- CORS settings
- Authentication tokens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact: [your-email@example.com]
- Documentation: [Link to docs]

## 🔄 Changelog

### v1.0.0 (Latest)
- ✅ Complete demo mode implementation
- ✅ Real-time voice analysis pipeline
- ✅ Compliance rules engine
- ✅ Evidence tracking and timestamping
- ✅ Analytics dashboard
- ✅ Audio upload and processing

---

**RegPulse** - Empowering compliant conversations through intelligent voice analysis.
