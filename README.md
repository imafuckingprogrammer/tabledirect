# TableDirect 🍽️

**Complete Restaurant QR Ordering System**

A modern, real-time restaurant ordering platform that allows customers to scan QR codes at tables and place orders directly from their phones, while providing restaurant staff with powerful management tools.

## ✨ Features

### 🎯 Customer Experience
- **QR Code Ordering** - Scan table QR codes to access menu instantly
- **Digital Menu** - Browse organized menu with categories, prices, and descriptions
- **Real-time Cart** - Add items, customize quantities, add special instructions
- **Order Tracking** - Track order status from placement to completion
- **Mobile Optimized** - Seamless experience on all devices

### 👨‍💼 Restaurant Management
- **Dashboard** - Real-time stats, revenue tracking, order analytics
- **Menu Management** - Full CRUD operations for items and categories
- **Table Management** - QR code generation, table configuration
- **Order Management** - Real-time order tracking and status updates
- **Staff Management** - Team invitations, role assignments, permissions

### 👨‍🍳 Kitchen Interface
- **Real-time Orders** - Live order queue with urgency indicators
- **Atomic Claiming** - Prevent conflicts when multiple chefs work together
- **Order Tracking** - Track preparation progress by item
- **Station Management** - Assign orders to specific kitchen stations

## 🚀 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS 3.x with custom design system
- **Backend:** Supabase (PostgreSQL + Real-time subscriptions)
- **Icons:** Lucide React
- **QR Codes:** qrcode library
- **Deployment:** Vercel-ready

## 🏗️ Architecture

### Database Schema
- **Users & Authentication** - Role-based access control
- **Restaurant Management** - Multi-tenant architecture
- **Menu System** - Categories, items, pricing, availability
- **Order System** - Real-time order processing with atomic operations
- **Session Management** - Kitchen staff session tracking

### Real-time Features
- Live order updates across all interfaces
- Real-time inventory and availability changes
- Staff session monitoring with heartbeat system
- Atomic order claiming to prevent conflicts

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tabledirect.git
   cd tabledirect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema (provided in `/database` folder)
   - Configure Row Level Security policies

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📱 Usage

### For Restaurant Owners
1. **Sign up** and create your restaurant profile
2. **Set up menu** - Add categories and menu items
3. **Create tables** - Generate QR codes for each table
4. **Invite staff** - Add team members with appropriate roles
5. **Go live** - Print QR codes and start receiving orders

### For Kitchen Staff
1. **Sign in** with chef credentials
2. **Access kitchen interface** at `/kitchen`
3. **Claim orders** atomically to prevent conflicts
4. **Track progress** and update order status
5. **Mark items complete** when ready

### For Customers
1. **Scan QR code** at restaurant table
2. **Browse menu** and add items to cart
3. **Customize orders** with special instructions
4. **Submit order** with contact information
5. **Track status** in real-time

## 🎨 Design System

### Color Palette
- **Primary:** Blue (#3B82F6) - Actions and highlights
- **Success:** Green (#10B981) - Confirmations and success states
- **Warning:** Orange (#F59E0B) - Alerts and pending states
- **Error:** Red (#EF4444) - Errors and destructive actions

### Components
- Consistent card-based layouts
- Mobile-first responsive design
- Accessible color contrasts
- Professional typography with Inter font

## 🔐 Security

- **Row Level Security** - Database-level access control
- **Role-based permissions** - Granular user access management
- **Secure authentication** - Supabase Auth with JWT tokens
- **API protection** - Server-side validation and sanitization

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on every push to main

### Manual Deployment
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure
```
src/
├── components/         # Reusable UI components
├── contexts/          # React contexts for state management
├── lib/               # Utility functions and configurations
├── pages/             # Page components and routing
├── types/             # TypeScript type definitions
└── styles/            # Global styles and Tailwind config
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** [Wiki](https://github.com/yourusername/tabledirect/wiki)
- **Issues:** [GitHub Issues](https://github.com/yourusername/tabledirect/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/tabledirect/discussions)

## 🎯 Roadmap

- [ ] **Mobile Apps** - Native iOS and Android applications
- [ ] **Payment Integration** - Stripe/PayPal integration for online payments
- [ ] **Inventory Management** - Track ingredients and stock levels
- [ ] **Analytics Dashboard** - Advanced reporting and insights
- [ ] **Multi-language Support** - Internationalization for global use
- [ ] **Loyalty Program** - Customer rewards and retention features

---

**Built with ❤️ for the restaurant industry**

Transform your restaurant's ordering experience with TableDirect - where technology meets hospitality.
