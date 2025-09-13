# IG Preview

A production-ready web application for photographers to upload portrait photos, arrange them in an Instagram-style grid, and generate time-limited preview links for client consent and feedback.

## Features

- 🔐 **Secure Authentication** - Supabase Auth with magic link/email password
- 📸 **Photo Upload** - Multiple image upload to private Supabase Storage
- 🎯 **Drag & Drop Reordering** - Intuitive photo arrangement with @dnd-kit
- 🔗 **Time-Limited Preview Links** - Generate shareable URLs that expire after 1 hour
- 📱 **Responsive Design** - Instagram-style grid that works on all devices
- 🖼️ **Lightbox Modal** - Full-screen photo viewing with navigation
- 🔒 **Private by Default** - Photos remain private; only signed URLs are exposed
- ⚡ **Serverless Functions** - Netlify Functions for secure URL generation

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + Postgres + Storage)
- **Deployment**: Netlify with @netlify/plugin-nextjs
- **Drag & Drop**: @dnd-kit
- **Authentication UI**: @supabase/auth-ui-react

## Project Structure

```
IG_preview/
├── pages/
│   ├── _app.tsx              # App wrapper with Supabase context
│   ├── index.tsx             # Home page
│   ├── admin.tsx             # Admin dashboard (auth required)
│   └── preview/
│       └── [token].tsx       # Public preview page
├── netlify/
│   └── functions/
│       └── signed-urls.ts    # Serverless function for URL generation
├── lib/
│   ├── supabaseBrowser.ts    # Browser Supabase client
│   ├── supabaseServer.ts     # Server Supabase client
│   └── database.types.ts     # TypeScript database types
├── styles/
│   └── globals.css           # Global styles with Tailwind
├── netlify.toml              # Netlify configuration
├── tailwind.config.ts        # Tailwind configuration
└── package.json              # Dependencies and scripts
```

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd IG_preview
npm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase Setup

### 1. Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be ready

### 2. Database Schema

Run this SQL in the Supabase SQL Editor:

```sql
-- Create tables
create table feeds (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_at timestamptz default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid references feeds(id) on delete cascade,
  storage_path text not null,
  caption text,
  tags text[],
  order_index int default 0,
  created_at timestamptz default now()
);

create table previews (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid references feeds(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table feeds enable row level security;
alter table photos enable row level security;
alter table previews enable row level security;

-- Policies for authenticated users
create policy "auth feeds" on feeds for all to authenticated using (true) with check (true);
create policy "auth photos" on photos for all to authenticated using (true) with check (true);

-- Policies for previews (insert/delete only for auth, no client select)
create policy "insert previews" on previews for insert to authenticated with check (true);
create policy "delete previews" on previews for delete to authenticated using (true);
create policy "no client select previews" on previews for select using (false);
```

### 3. Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `photos`
3. Set the bucket to **Private** (not public)
4. Update bucket policies if needed:

```sql
-- Allow authenticated users to upload/delete photos
create policy "auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'photos');
create policy "auth delete" on storage.objects for delete to authenticated using (bucket_id = 'photos');
```

### 4. Get Your Keys

1. Go to **Settings** > **API**
2. Copy your:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key (keep this secure!)

## Netlify Deployment

### 1. Prepare for Deployment

Ensure your code is pushed to a Git repository (GitHub, GitLab, etc.).

### 2. Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Click "Deploy site"

### 3. Environment Variables

In your Netlify dashboard, go to **Site settings** > **Environment variables** and add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Install Netlify Plugin

The `@netlify/plugin-nextjs` plugin is already configured in `netlify.toml`. Netlify will automatically install it during deployment.

### 5. Redeploy

After adding environment variables, trigger a new deployment:

1. Go to **Deploys**
2. Click "Trigger deploy" > "Deploy site"

## Usage

### Admin Dashboard (`/admin`)

1. **Sign In**: Use email/password or magic link authentication
2. **Upload Photos**: Select multiple images to upload
3. **Reorder Photos**: Drag and drop photos to rearrange them
4. **Generate Preview Link**: Click the button to create a shareable URL
5. **Copy Link**: Share the time-limited URL with clients

### Preview Page (`/preview/[token]`)

- **Public Access**: No authentication required
- **Grid View**: Instagram-style responsive photo grid
- **Lightbox**: Click any photo for full-screen viewing
- **Navigation**: Use arrow keys or buttons to navigate between photos
- **Expiration**: Links expire after 1 hour for security

## Security Features

- **Private Storage**: Photos are stored in a private Supabase bucket
- **Row Level Security**: Database policies ensure data isolation
- **Signed URLs**: Temporary URLs with automatic expiration
- **Token-Based Access**: Preview links use secure random tokens
- **No Public Endpoints**: Photos are never publicly accessible

## Customization

### Styling

- Modify `styles/globals.css` for global styles
- Update `tailwind.config.ts` for theme customization
- Component styles use Tailwind utility classes

### Preview Link Duration

To change the 1-hour expiration:

1. **Admin page**: Update the `expiresAt` calculation in `pages/admin.tsx`
2. **Serverless function**: Update the signed URL duration in `netlify/functions/signed-urls.ts`

### Grid Layout

Modify the grid classes in `styles/globals.css`:

```css
.photo-grid {
  @apply grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3;
  /* Change to: grid-cols-2 md:grid-cols-3 xl:grid-cols-4 for more columns */
}
```

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure all environment variables are set correctly
   - Check for typos in variable names

2. **Photos not loading in preview**
   - Verify the storage bucket is named `photos`
   - Check that the bucket policies allow signed URL generation

3. **Authentication not working**
   - Confirm Supabase Auth is enabled
   - Check redirect URLs in Supabase Auth settings

4. **Netlify Functions not working**
   - Ensure `@netlify/plugin-nextjs` is installed
   - Check function logs in Netlify dashboard

### Development Tips

- Use browser dev tools to inspect network requests
- Check Supabase logs for database errors
- Test with different image formats and sizes
- Verify CORS settings if making external requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review Supabase and Netlify documentation
3. Open an issue in the repository

---

**Built with ❤️ for photographers who need a simple, secure way to share their work.**