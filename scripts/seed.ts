import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedDatabase() {
  console.log('Starting database seed...')

  try {
    // Seed Charities
    console.log('Seeding charities...')
    const charities = [
      {
        name: 'Youth Education Foundation',
        description: 'Providing educational opportunities for underprivileged children worldwide through scholarships, school supplies, and mentorship programs.',
        image_url: null,
        website_url: 'https://example.com/youth-education',
        featured: true,
      },
      {
        name: 'Environmental Conservation Fund',
        description: 'Protecting our planet through conservation initiatives, reforestation projects, and wildlife preservation efforts across the globe.',
        image_url: null,
        website_url: 'https://example.com/conservation',
        featured: true,
      },
      {
        name: 'Healthcare Access Initiative',
        description: 'Ensuring quality healthcare reaches communities in need around the globe through mobile clinics, medical supplies, and health education.',
        image_url: null,
        website_url: 'https://example.com/healthcare',
        featured: true,
      },
      {
        name: 'Animal Welfare Society',
        description: 'Rescuing and rehabilitating animals in need, promoting adoption, and advocating for animal rights and protection laws.',
        image_url: null,
        website_url: 'https://example.com/animal-welfare',
        featured: false,
      },
      {
        name: 'Clean Water Foundation',
        description: 'Building wells and water purification systems in communities lacking access to clean, safe drinking water.',
        image_url: null,
        website_url: 'https://example.com/clean-water',
        featured: false,
      },
      {
        name: 'Food Security Network',
        description: 'Fighting hunger and malnutrition by providing food assistance, supporting sustainable agriculture, and empowering local communities.',
        image_url: null,
        website_url: 'https://example.com/food-security',
        featured: false,
      },
    ]

    for (const charity of charities) {
      const { error } = await supabase
        .from('charities')
        .insert(charity)
      
      if (error) {
        console.error(`Error inserting charity ${charity.name}:`, error)
      } else {
        console.log(`✓ Inserted charity: ${charity.name}`)
      }
    }

    // Create Admin User (you'll need to manually set this in Supabase dashboard)
    console.log('\nAdmin User Setup:')
    console.log('To create an admin user, follow these steps:')
    console.log('1. Go to your Supabase project dashboard')
    console.log('2. Navigate to Authentication > Users')
    console.log('3. Create a new user with email: admin@digitalheroes.co.in')
    console.log('4. Set a secure password')
    console.log('5. Go to SQL Editor and run:')
    console.log(`UPDATE profiles SET is_admin = true WHERE email = 'admin@digitalheroes.co.in';`)
    console.log('\nOr use the Supabase Auth API to create the user, then run the SQL update.')

    console.log('\n✓ Database seed completed!')
    console.log('\nNext steps:')
    console.log('1. Create an admin user in Supabase')
    console.log('2. Set up Stripe products and prices')
    console.log('3. Configure environment variables')
    console.log('4. Run the development server: npm run dev')

  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
