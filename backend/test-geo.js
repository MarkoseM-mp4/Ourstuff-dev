const mongoose = require('mongoose');
const User = require('./models/User');
const Item = require('./models/Item');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ourstuff').then(() => {
    console.log('✅ Connected to MongoDB for Geo Test...');
    runTest();
}).catch(err => console.error(err));

async function runTest() {
    try {
        // 1. Create a dummy Test User
        console.log('\n👤 Creating a test user...');
        await User.deleteOne({ email: 'geotest@example.com' }); // Cleanup old test user
        const user = await User.create({
            name: 'Geo Tester',
            email: 'geotest@example.com',
            password: 'password123',
            isVerified: true,
            coordinates: [76.5385, 9.5916] // [Longitude, Latitude] for Kottayam
        });

        // 2. Insert items at different distances from Kottayam [76.5385, 9.5916]
        console.log('📦 Creating mock items at different coordinates...');
        await Item.deleteMany({ owner: user._id }); // Cleanup old items

        const items = [
            {
                owner: user._id, title: 'Item EXACTLY in Kottayam (0 km)',
                description: 'Close by', category: 'Other', pricePerDay: 100, location: 'Kottayam',
                coordinates: [76.5385, 9.5916]
            },
            {
                owner: user._id, title: 'Item in Ernakulam (~60 km away)',
                description: 'A bit far', category: 'Other', pricePerDay: 100, location: 'Ernakulam',
                coordinates: [76.2999, 9.9816]
            },
            {
                owner: user._id, title: 'Item in Thiruvananthapuram (~150 km away)',
                description: 'Very far', category: 'Other', pricePerDay: 100, location: 'Thiruvananthapuram',
                coordinates: [76.9366, 8.5241]
            }
        ];
        await Item.insertMany(items);

        // 3. Test the Geospatial Query ($near) manually just like the API does
        const testRadiuses = [10, 80, 200]; // in km
        const testLng = 76.5385; // Kottayam
        const testLat = 9.5916;  // Kottayam

        console.log('\n🔎 --- RUNNING $near GEOSPATIAL QUERIES ---');

        for (const radius of testRadiuses) {
            console.log(`\n📍 Searching within ${radius} km radius of Kottayam...`);

            const results = await Item.find({
                coordinates: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [testLng, testLat]
                        },
                        $maxDistance: radius * 1000 // Convert to meters
                    }
                }
            }).select('title location');

            console.log(`✅ Found ${results.length} items:`);
            results.forEach(i => console.log(`   - "${i.title}"`));
        }

        console.log('\n🎉 Test completed successfully!');
    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        mongoose.disconnect();
        process.exit();
    }
}
